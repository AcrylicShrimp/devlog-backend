import { Controller, UseGuards } from '@nestjs/common';
import { Get, Post, Delete, Patch } from '@nestjs/common';
import { Body, Param } from '@nestjs/common';
import {
	BadRequestException,
	ConflictException,
	NotFoundException
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import validator from 'validator';

import { AdminGuard } from './admin.guard';

import { DBConnService } from '../db/db.conn.service';

import { Category } from '../db/entity/Category';
import { PostItem } from '../db/entity/PostItem';

@Controller()
@UseGuards(AdminGuard)
export class AdminCategoryController {
	constructor(private conn: DBConnService) {}

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

	@Delete('admin/categories/:name')
	async deleteCategory(@Param('name') name: string): Promise<void> {
		if (!name || !(name = name.trim()))
			throw new BadRequestException('name required');

		if (!validator.isLength(name, { max: 32 }))
			throw new BadRequestException('name too long');

		await this.conn.conn.transaction(async (mgr) => {
			const category = await mgr.findOne(Category, {
				where: { name },
				select: ['id']
			});

			if (!category) throw new NotFoundException('no category found');

			await mgr.update(PostItem, { category }, { category: undefined });
			await mgr.remove(category);
		});
	}

	@Patch('admin/categories/:name')
	async updateCategory(
		@Param('name') name: string,
		@Body('new-name') newName: string | undefined,
		@Body('new-desc') newDesc: string | undefined
	): Promise<void> {
		if (!name || !(name = name.trim()))
			throw new BadRequestException('name required');

		if (!validator.isLength(name, { max: 32 }))
			throw new BadRequestException('name too long');

		if (newName !== undefined) {
			if (!(newName = newName.trim()))
				throw new BadRequestException('invalid new name');

			if (!validator.isLength(newName, { max: 32 }))
				throw new BadRequestException('new name too long');
		}

		if (newDesc !== undefined) {
			if (!(newDesc = newDesc.trim())) newDesc = '';

			if (!validator.isLength(newDesc, { max: 256 }))
				throw new BadRequestException('new desc too long');
		}

		await this.conn.conn.transaction(async (mgr) => {
			const category = await mgr.findOne(Category, {
				where: { name }
			});

			if (!category) throw new NotFoundException('no category found');

			if (newName !== undefined) category.name = newName;
			if (newDesc !== undefined) category.description = newDesc;

			try {
				await mgr.save(category);
			} catch (err) {
				if (err instanceof QueryFailedError)
					throw new ConflictException('new name already exists');

				throw err;
			}
		});
	}
}
