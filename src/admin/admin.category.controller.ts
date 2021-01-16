import { Controller, UseGuards } from '@nestjs/common';
import { Post, Delete, Patch } from '@nestjs/common';
import { Body, Param } from '@nestjs/common';
import {
	BadRequestException,
	ConflictException,
	NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { AdminGuard } from './admin.guard';

import { DBConnService } from '../db/db.conn.service';
import { ViewSSRCacheService } from '../view/view.ssr.cache.service';

import { OptionalPipe } from '../helper/OptionalPipe';
import { StringPipe } from '../helper/StringPipe';

import { Category } from '../db/entity/Category';
import { PostItem } from '../db/entity/PostItem';

@Controller()
@UseGuards(AdminGuard)
export class AdminCategoryController {
	constructor(
		private conn: DBConnService,
		private cache: ViewSSRCacheService
	) {}

	@Post('admin/categories')
	async newCategory(
		@Body('name', new StringPipe(32)) name: string,
		@Body('desc', new StringPipe(256, true)) desc: string
	): Promise<void> {
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

		this.cache.purge();
	}

	@Delete('admin/categories/:name')
	async deleteCategory(
		@Param('name', new StringPipe(32)) name: string
	): Promise<void> {
		await this.conn.conn.transaction(async (mgr) => {
			const category = await mgr.findOne(Category, {
				where: { name },
				select: ['id'],
			});

			if (!category) throw new NotFoundException('no category found');

			await mgr.update(PostItem, { category }, { category: undefined });
			await mgr.remove(category);

			this.cache.purge();
		});
	}

	@Patch('admin/categories/:name')
	async updateCategory(
		@Param('name', new StringPipe(32)) name: string,
		@Body('new-name', new OptionalPipe(new StringPipe(32)))
		newName: string | undefined,
		@Body('new-desc', new OptionalPipe(new StringPipe(256, true)))
		newDesc: string | undefined
	): Promise<void> {
		if (newName === undefined && newDesc === undefined)
			throw new BadRequestException('nothing to patch');

		await this.conn.conn.transaction(async (mgr) => {
			const category = await mgr.findOne(Category, {
				where: { name },
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

			this.cache.purge();
		});
	}
}
