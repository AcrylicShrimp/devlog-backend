import { Controller } from '@nestjs/common';
import { Delete, Post } from '@nestjs/common';
import { Body, Param } from '@nestjs/common';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import validator from 'validator';

import { AuthTokenService } from '../auth/auth.token.service';
import { DBConnService } from '../db/db.conn.service';

import { Admin } from '../db/entity/Admin';
import { AdminSession } from '../db/entity/AdminSession';

@Controller()
export class AdminSessionController {
	constructor(private conn: DBConnService, private token: AuthTokenService) {}

	@Post('admin/sessions')
	async authenticate(
		@Body('username') username: string,
		@Body('pw') pw: string
	): Promise<string> {
		if (!username || !(username = username.trim()))
			throw new BadRequestException('username required');

		if (!pw) throw new BadRequestException('pw required');

		return await this.conn.conn.transaction(async (mgr) => {
			const admin = await mgr.findOne(Admin, {
				where: { username },
				select: ['id', 'pw'],
			});

			if (!admin || !(await this.token.comparePW(pw, admin.pw)))
				throw new UnauthorizedException('bad username or pw');

			let session = await mgr.findOne(AdminSession, {
				where: { user: admin },
				select: ['id'],
			});

			if (session) await mgr.remove(session);

			session = new AdminSession();
			session.token = await this.token.generate();
			session.user = admin;
			session.usedAt = new Date();
			await mgr.save(session);

			return session.token;
		});
	}

	@Delete('admin/sessions/:token')
	async deauthenticate(@Param('token') token: string): Promise<void> {
		if (
			!token ||
			!(token = token.trim()) ||
			!validator.isLength(token, { min: 256, max: 256 })
		)
			throw new BadRequestException('bad token');

		await this.conn.conn.transaction(async (mgr) => {
			const session = await mgr.findOne(AdminSession, {
				where: { token },
				select: ['id'],
			});

			if (session) await mgr.remove(session);
		});
	}
}
