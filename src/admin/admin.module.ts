import { Module } from '@nestjs/common';

import { AdminSessionController } from './admin.session.controller';
import { AuthModule } from '../auth/auth.module';
import { AdminCategoryController } from './admin.category.controller';

@Module({
	imports: [AuthModule],
	controllers: [AdminSessionController, AdminCategoryController]
})
export class AdminModule {}
