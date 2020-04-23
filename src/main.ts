import { NestFactory } from '@nestjs/core';
import { Request, Response, NextFunction } from 'express';

import helmet from 'helmet';
import cors from 'cors';
import busboy from 'connect-busboy';

import { AppModule } from './app.module';

(async () => {
	const app = await NestFactory.create(AppModule);

	app.use(helmet());
	app.use(
		cors({
			origin: ['https://blog.ashrimp.dev'],
			optionsSuccessStatus: 200,
			methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'
		})
	);
	app.use(busboy());
	app.use((req: Request, res: Response, next: NextFunction) => {
		req.busboy.on(
			'field',
			(key, value, keyTruncated, valueTruncated) =>
				(req.body[key] = value)
		);
		req.pipe(req.busboy);

		next();
	});

	await app.listen(8000, '0.0.0.0');
})();
