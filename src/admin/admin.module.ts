import { Module } from '@nestjs/common';

import { AdminSessionController } from './admin.session.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [AuthModule],
	controllers: [AdminSessionController]
})
export class AdminModule {}
