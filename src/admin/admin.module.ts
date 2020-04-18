import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { AdminSessionController } from './admin.session.controller';
import { AdminCategoryController } from './admin.category.controller';

@Module({
	imports: [AuthModule],
	controllers: [AdminSessionController, AdminCategoryController]
})
export class AdminModule {}
