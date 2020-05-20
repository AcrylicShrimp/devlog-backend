import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { AdminSessionController } from './admin.session.controller';
import { AdminCategoryController } from './admin.category.controller';
import { AdminPostController } from './admin.post.controller';

@Module({
	imports: [AuthModule],
	controllers: [
		AdminSessionController,
		AdminCategoryController,
		AdminPostController,
	],
})
export class AdminModule {}
