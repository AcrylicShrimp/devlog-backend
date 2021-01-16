/* eslint-disable @typescript-eslint/no-empty-function */
import { Controller, Get, Header, Logger, Param } from '@nestjs/common';
import * as fs from 'fs';
import { JSDOM } from 'jsdom';
import * as path from 'path';

import { ViewSSRCacheService } from './view.ssr.cache.service';

import { OptionalPipe } from '../helper/OptionalPipe';
import { StringPipe } from '../helper/StringPipe';

@Controller()
export class ViewSSRController {
	private readonly logger = new Logger(ViewSSRController.name);

	private readonly frontendEvent: string;
	private readonly indexHTML: string;
	private readonly scripts: string[];
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

	@Get('ssr/:path(*)?')
	@Header('Content-Type', 'text/html')
	@Header(
		'Content-Security-Policy',
		"default-src 'self' https:; script-src 'self'; style-src 'unsafe-inline' 'self' https:;"
	)
	async generateSSRPage(
		@Param('path', new OptionalPipe(new StringPipe(Number.MAX_VALUE, true)))
		path: string | undefined
	): Promise<string> {
		const pagePath = path ?? '';

		this.logger.debug(`Begining page(=${pagePath})`);

		const data = this.cache.get(pagePath);

		if (data) {
			this.logger.debug(`Cache hit`);
			return data;
		}

		return new Promise((resolve, reject) => {
			const dom = new JSDOM(this.indexHTML, {
				runScripts: 'outside-only',
				url: `${process.env.SSR_FRONTEND_URL}${pagePath}`,
			});

			this.logger.debug(
				`DOM created (url=${process.env.SSR_FRONTEND_URL}${pagePath})`
			);

			// Poly-fill some window functions here.
			dom.window.scrollTo = () => {};

			const timeout = setTimeout(() => {
				this.logger.warn(
					`Unable to generate page(=${pagePath}), timed out(exceeds ${this.timeout}ms)!`
				);
				reject('timeout');
			}, this.timeout);

			this.logger.debug(`Timeout(=${this.timeout}ms) set`);

			dom.window.addEventListener(this.frontendEvent, () => {
				this.logger.debug(`Event(=${this.frontendEvent}) received`);

				clearTimeout(timeout);

				for (const attachment of this.attachments) {
					const script = dom.window.document.createElement('script');
					script.src = attachment;
					dom.window.document.body.appendChild(script);
					this.logger.debug(`Script(=${attachment}) attached`);
				}

				const data = dom.serialize();
				this.cache.set(pagePath, data);
				resolve(data);
			});

			this.logger.debug(
				`Event(=${this.frontendEvent}) listener attached`
			);

			// Remove all pre-existing scripts.
			const scripts = dom.window.document.getElementsByTagName('script');

			this.logger.debug(`Script(=${scripts.length}) found, removing`);

			for (let index = scripts.length - 1; 0 <= index; --index)
				scripts[index].parentNode?.removeChild(scripts[index]);

			try {
				for (const script of this.scripts) {
					dom.window.eval(script);
					this.logger.debug(
						`Script(=${script.length} characters) executed`
					);
				}
			} catch (err) {
				this.logger.warn(
					`Unable to generate page(=${pagePath}), an error(=${err}) occurred!`
				);
				reject('error');
			}
		});
	}
}
