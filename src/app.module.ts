import { Module, Type, DynamicModule } from '@nestjs/common';
import { SentryModule } from '@ntegral/nestjs-sentry';
import { LogLevel } from '@sentry/types';

import { AdminModule } from './admin/admin.module';
import { DBModule } from './db/db.module';
import { ViewModule } from './view/view.module';

const imports: (Type<any> | DynamicModule)[] = [
	AdminModule,
	DBModule,
	ViewModule,
];

if (process.env.SENTRY_DSN)
	imports.push(
		SentryModule.forRoot({
			dsn: process.env.SENTRY_DSN,
			debug: false,
			environment: process.env.NODE_ENV,
			logLevel: LogLevel.Error,
		})
	);

@Module({ imports })
export class AppModule {}
