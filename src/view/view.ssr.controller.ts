/* eslint-disable @typescript-eslint/no-empty-function */
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

	constructor() {
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
		"default-src 'self' https:; img-src 'self' http: data:; style-src 'unsafe-inline' 'self' https:;"
	)
	async generateSSRPage(
		@Param('path', new OptionalPipe(new StringPipe(Number.MAX_VALUE, true)))
		path: string | undefined
	): Promise<string> {
		path = path ?? '';

		return new Promise((resolve, reject) => {
			const dom = new JSDOM(this.indexHTML, {
				runScripts: 'dangerously',
				url: `${process.env.SSR_FRONTEND_URL}${path}`,
				resources: 'usable',
			});

			// Poly-fill some window functions here.
			dom.window.scrollTo = () => {};

			const timeout = setTimeout(() => {
				this.logger.warn(
					`Unable to generate page(=${path}), timed out(exceeds ${this.timeout}ms)!`
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

				resolve(dom.serialize());
				dom.window.close();
			});

			try {
				for (const script of this.scripts) dom.window.eval(script);
			} catch (err) {
				this.logger.warn(
					`Unable to generate page(=${path}), an error(=${err}) occurred!`
				);
				reject('error');
			}
		});
	}
}
