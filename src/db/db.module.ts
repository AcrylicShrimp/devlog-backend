import { Global, Module } from '@nestjs/common';
import { createConnection } from 'typeorm';

import { DBConnService } from './db.conn.service';

@Global()
@Module({
	providers: [
		{
			provide: DBConnService,
			useFactory: async () => new DBConnService(await createConnection()),
		},
	],
	exports: [DBConnService],
})
export class DBModule {}
