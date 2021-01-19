import {
	Controller,
	Get,
	Header,
	Logger,
	Param,
	Patch,
	UseGuards,
} from '@nestjs/common';
import * as fs from 'fs';
import { JSDOM } from 'jsdom';
import * as path from 'path';

import { AdminGuard } from '../admin/admin.guard';

import { ViewSSRCacheService } from './view.ssr.cache.service';

import { OptionalPipe } from '../helper/OptionalPipe';
import { StringPipe } from '../helper/StringPipe';

@Controller()
export class ViewSSRController {
	private readonly logger = new Logger(ViewSSRController.name);

	private indexHTML: string;
	private scripts: string[];
	private readonly frontendEvent: string;
	private readonly attachments: string[];
	private readonly timeout: number;

	constructor(private cache: ViewSSRCacheService) {
		const frontendDir = process.env.SSR_FRONTEND_DIR || process.cwd();
		this.frontendEvent = process.env.SSR_FRONTEND_EVENT || 'app-loaded';
		this.indexHTML = fs.readFileSync(
			path.join(frontendDir, 'index.html'),
			'utf-8'
		);
		this.scripts = (process.env.SSR_FRONTEND_SCRIPTS || '')
			.split(',')
			.map((script) =>
				fs.readFileSync(path.join(frontendDir, script.trim()), 'utf-8')
			);
		this.attachments = (process.env.SSR_FRONTEND_SCRIPT_ATTACHMENTS || '')
			.split(',')
			.map((attachment) => attachment.trim());
		this.timeout = Number(process.env.SSR_FRONTEND_TIMEOUT || 5000);
	}

	@UseGuards(AdminGuard)
	@Patch('admin/ssr')
	async updateSSRPageCaches(): Promise<void> {
		const frontendDir = process.env.SSR_FRONTEND_DIR || process.cwd();
		this.indexHTML = fs.readFileSync(
			path.join(frontendDir, 'index.html'),
			'utf-8'
		);
		this.scripts = (process.env.SSR_FRONTEND_SCRIPTS || '')
			.split(',')
			.map((script) =>
				fs.readFileSync(path.join(frontendDir, script.trim()), 'utf-8')
			);
	}

	@Get('ssr/:path(*)?')
	@Header('Content-Type', 'text/html')
	@Header(
		'Content-Security-Policy',
		"default-src 'self' https:; img-src 'self' https: data:; media-src 'self' https: data: blob:; style-src 'unsafe-inline' 'self' https:;"
	)
	async generateSSRPage(
		@Param('path', new OptionalPipe(new StringPipe(Number.MAX_VALUE, true)))
		path: string | undefined
	): Promise<string> {
		const pagePath = path ?? '';
		const data = this.cache.get(pagePath);

		if (data) return data;

		return new Promise((resolve, reject) => {
			const dom = new JSDOM(this.indexHTML, {
				runScripts: 'dangerously',
				url: `${process.env.SSR_FRONTEND_URL}${pagePath}`,
				resources: 'usable',
			});

			// Poly-fill some window functions here.
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			dom.window.scrollTo = () => {};

			const timeout = setTimeout(() => {
				this.logger.warn(
					`Unable to generate page(=${pagePath}), timed out(exceeds ${this.timeout}ms)!`
				);
				reject('timeout');
			}, this.timeout);

			dom.window.addEventListener(this.frontendEvent, () => {
				clearTimeout(timeout);

				for (const attachment of this.attachments) {
					const script = dom.window.document.createElement('script');
					script.src = attachment;
					dom.window.document.body.appendChild(script);
				}

				const data = dom.serialize();
				dom.window.close();
				this.cache.set(pagePath, data);
				resolve(data);
			});

			try {
				for (const script of this.scripts) dom.window.eval(script);
			} catch (err) {
				this.logger.warn(
					`Unable to generate page(=${pagePath}), an error(=${err}) occurred!`
				);
				reject('error');
			}
		});
	}
}
