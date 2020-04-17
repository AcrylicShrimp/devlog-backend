import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import cors from 'cors';

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

	await app.listen(8000, '0.0.0.0');
})();
