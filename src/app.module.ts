import { Module } from '@nestjs/common';

import { AdminModule } from './admin/admin.module';
import { DBModule } from './db/db.module';
import { ViewModule } from './view/view.module';

@Module({ imports: [AdminModule, DBModule, ViewModule] })
export class AppModule {}
