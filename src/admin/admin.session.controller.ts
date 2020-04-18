import {
	Controller,
	Post,
	Body,
	HttpException,
	HttpStatus
} from '@nestjs/common';

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
			throw new HttpException(
				'username required',
				HttpStatus.BAD_REQUEST
			);

		if (!pw) throw new HttpException('pw required', HttpStatus.BAD_REQUEST);

		return await this.conn.conn.transaction(async (mgr) => {
			const admin = await mgr.findOne(Admin, {
				where: { username },
				select: ['id', 'pw']
			});

			if (!admin || !(await this.token.comparePW(pw, admin.pw)))
				throw new HttpException(
					'bad username or pw',
					HttpStatus.UNAUTHORIZED
				);

			let session = await mgr.findOne(AdminSession, {
				where: { user: admin },
				select: ['id']
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
}
