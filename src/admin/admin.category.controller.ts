import { Controller, UseGuards, Get } from '@nestjs/common';

import { AdminGuard } from './admin.guard';

import { DBConnService } from '../db/db.conn.service';

import { Category } from '../db/entity/Category';

@Controller()
@UseGuards(AdminGuard)
export class AdminCategoryController {
	constructor(private conn: DBConnService) {}

	@Get('admin/categories')
	async listCategories(): Promise<Category[]> {
		return this.conn.conn.manager.find(Category, {
			order: {
				name: 'ASC'
			}
		});
	}
}
