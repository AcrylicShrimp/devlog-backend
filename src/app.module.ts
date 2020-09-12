import { Module } from '@nestjs/common';

import { AdminModule } from './admin/admin.module';
import { DBModule } from './db/db.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ViewModule } from './view/view.module';

@Module({
	imports: [AdminModule, DBModule, SchedulerModule, ViewModule],
})
export class AppModule {}
