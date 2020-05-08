import { Controller, UseGuards, Session } from '@nestjs/common';
import { Get } from '@nestjs/common';
import { Query } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import validator from 'validator';

import { AdminNonBlockGuard } from '../admin/admin.nonblock.guard';

import { DBConnService } from '../db/db.conn.service';

import { AdminSession } from '../db/entity/AdminSession';
import { Category } from '../db/entity/Category';
import { PostItem, PostItemAccessLevel } from '../db/entity/PostItem';
import { PostItemImage } from '../db/entity/PostItemImage';

import { asEnum, isEnum } from '../helper/Enum';
import { SlugRegex } from '../helper/Regex';

@Controller()
@UseGuards(AdminNonBlockGuard)
export class PostController {
	constructor(private conn: DBConnService) {}

	@Get('posts')
	async listPosts(
		@Session() session: AdminSession,
		@Query('category') category: string,
		@Query('before') before: string,
		@Query('after') after: string
	): Promise<PostItem[]> {
		if (category !== undefined) {
			if (!category || !(category = category.trim()))
				throw new BadRequestException('invalid category');

			if (!validator.isLength(category, { max: 32 }))
				throw new BadRequestException('category too long');
		}

		if (before !== undefined) {
			if (!before || !(before = before.trim()))
				throw new BadRequestException('invalid before');

			if (!SlugRegex.test(before))
				throw new BadRequestException('bad before');
		}

		if (after !== undefined) {
			if (!after || !(after = after.trim()))
				throw new BadRequestException('invalid after');

			if (!SlugRegex.test(after))
				throw new BadRequestException('bad after');
		}

		if (before && after)
			throw new BadRequestException('before and after cannot coexist');

		return await this.conn.conn.transaction(async (mgr) => {
			let categoryEntity: Category | undefined = undefined;

			if (category) {
				categoryEntity = await mgr.findOne(Category, {
					where: { name: category },
					select: ['id']
				});

				if (!categoryEntity)
					throw new BadRequestException('category not exists');
			}

			let anchor: PostItem | undefined = undefined;

			if (before || after) {
				anchor = await mgr.findOne(PostItem, {
					where: Object.assign(
						{
							slug: before || after
						},
						categoryEntity
							? { category: { id: categoryEntity.id } }
							: null,
						!session // Prevents info leaks
							? { accessLevel: PostItemAccessLevel.PUBLIC }
							: null
					),
					select: ['modifiedAt']
				});

				if (!anchor) throw new BadRequestException('anchor not exists');
			}

			let query = mgr
				.createQueryBuilder(PostItem, 'PostItem')
				.leftJoin('PostItem.category', 'Category')
				.select([
					'PostItem.slug',
					'PostItem.accessLevel',
					'PostItem.title',
					'PostItem.contentPreview',
					'PostItem.createdAt',
					'PostItem.modifiedAt',
					'Category.name'
				])
				.where('PostItem.content IS NOT NULL');

			// Anonymous users only can see public posts.
			if (!session)
				query = query.andWhere('PostItem.accessLevel = :accessLevel', {
					accessLevel: PostItemAccessLevel.PUBLIC
				});

			if (anchor)
				query = query.andWhere(
					`PostItem.modifiedAt ${before ? '<' : '>'} :modifiedAt`,
					{ modifiedAt: anchor.modifiedAt }
				);

			return query
				.orderBy('PostItem.modifiedAt', 'DESC')
				.limit(20)
				.getMany();
		});
	}
}
