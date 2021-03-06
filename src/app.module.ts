import { Module } from '@nestjs/common';

import { AdminModule } from './admin/admin.module';
import { DBModule } from './db/db.module';
import { ESModule } from './es/es.module';
import { ViewModule } from './view/view.module';

@Module({
	imports: [AdminModule, DBModule, ESModule, ViewModule],
})
export class AppModule {}
