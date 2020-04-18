import { Module } from '@nestjs/common';

import { DBModule } from './db/db.module';
import { AdminModule } from './admin/admin.module';

@Module({ imports: [AdminModule, DBModule] })
export class AppModule {}
