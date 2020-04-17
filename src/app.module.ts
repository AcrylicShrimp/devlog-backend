import { Module } from '@nestjs/common';

import { DBModule } from './db/db.module';

@Module({ imports: [DBModule] })
export class AppModule {}
