import { Controller } from '@nestjs/common';
import { Get } from '@nestjs/common';

import { DBConnService } from '../db/db.conn.service';

import { Category } from '../db/entity/Category';

@Controller()
export class ViewCategoryController {
	constructor(private conn: DBConnService) {}

	@Get('categories')
	async listCategories(): Promise<Category[]> {
		return this.conn.conn.manager.find(Category, {
			select: ['name', 'description', 'createdAt', 'modifiedAt'],
			order: {
				name: 'ASC',
			},
		});
	}
}
