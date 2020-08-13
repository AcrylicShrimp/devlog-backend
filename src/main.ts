import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') dotenv.config();

import { NestFactory } from '@nestjs/core';

import busboy from 'connect-busboy';
import cors from 'cors';
import helmet from 'helmet';

import { AppModule } from './app.module';

(async () => {
	const app = await NestFactory.create(AppModule);

	app.use(helmet());
	app.use(
		cors({
			origin: ['https://blog.ashrimp.dev'],
			optionsSuccessStatus: 200,
			methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		})
	);
	app.use(busboy());

	await app.listen(8000, '0.0.0.0');
})();
