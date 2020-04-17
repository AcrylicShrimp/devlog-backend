import { Module } from '@nestjs/common';

import { AuthTokenService } from './auth.token.service';

@Module({
	providers: [AuthTokenService],
	exports: [AuthTokenService]
})
export class AuthModule {}
