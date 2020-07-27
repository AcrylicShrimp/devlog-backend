import dotenv from 'dotenv';

import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/node';

import busboy from 'connect-busboy';
import cors from 'cors';
import helmet from 'helmet';

import { AppModule } from './app.module';

import { AllExceptionFilter } from './error/all.filter';

(async () => {
	dotenv.config();

	if (process.env.SENTRY_DSN) Sentry.init({ dsn: process.env.SENTRY_DSN });

	const app = await NestFactory.create(AppModule);

	if (process.env.SENTRY_DSN)
		app.use(
			Sentry.Handlers.requestHandler({
				request: ['session'],
				user: false,
			})
		);

	app.use(helmet());
	app.use(
		cors({
			origin: ['https://blog.ashrimp.dev'],
			optionsSuccessStatus: 200,
			methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		})
	);
	app.use(busboy());

	app.useGlobalFilters(new AllExceptionFilter());

	await app.listen(8000, '0.0.0.0');
})();
