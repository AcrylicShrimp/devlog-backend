/* eslint-disable @typescript-eslint/no-empty-function */
import { Controller, Get, Header, Logger, Param } from '@nestjs/common';
import * as fs from 'fs';
import { JSDOM } from 'jsdom';
import * as path from 'path';

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

	@Get('ssr/:path(*)')
	@Header('Content-Type', 'text/html')
	async generateSSRPage(
		@Param('path', new OptionalPipe(new StringPipe()))
		path: string | undefined
	): Promise<string> {
		path = path || '';

		return new Promise((resolve, reject) => {
			const dom = new JSDOM(this.indexHTML, {
				runScripts: 'outside-only',
				url: `${process.env.SSR_FRONTEND_URL}${path}`,
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
