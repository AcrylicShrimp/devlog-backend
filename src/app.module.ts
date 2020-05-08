import { Module } from '@nestjs/common';

import { AdminModule } from './admin/admin.module';
import { DBModule } from './db/db.module';
import { PostModule } from './post/post.module';

@Module({ imports: [AdminModule, DBModule, PostModule] })
export class AppModule {}
