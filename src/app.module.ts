import { Module } from '@nestjs/common';

import { AdminModule } from './admin/admin.module';
import { DBModule } from './db/db.module';

@Module({ imports: [AdminModule, DBModule] })
export class AppModule {}
