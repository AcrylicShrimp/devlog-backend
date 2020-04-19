import {
	Controller,
	UseGuards,
	Get,
	Post,
	Body,
	BadRequestException,
	ConflictException
} from '@nestjs/common';
import validator from 'validator';

import { AdminGuard } from './admin.guard';

import { DBConnService } from '../db/db.conn.service';

import { Category } from '../db/entity/Category';
import { QueryFailedError } from 'typeorm';

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

	@Post('admin/categories')
	async newCategory(
		@Body('name') name: string,
		@Body('desc') desc: string
	): Promise<void> {
		if (!name || !(name = name.trim()))
			throw new BadRequestException('name required');

		if (!validator.isLength(name, { max: 32 }))
			throw new BadRequestException('name too long');

		if (!desc || !(desc = desc.trim())) desc = '';

		if (!validator.isLength(desc, { max: 256 }))
			throw new BadRequestException('desc too long');

		const category = new Category();
		category.name = name;
		category.description = desc;

		try {
			await this.conn.conn.manager.save(category);
		} catch (err) {
			if (err instanceof QueryFailedError)
				throw new ConflictException('name already exists');

			throw err;
		}
	}
}
