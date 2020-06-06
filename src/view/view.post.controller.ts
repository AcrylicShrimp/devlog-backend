import { Controller, UseGuards, Session } from '@nestjs/common';
import { Get } from '@nestjs/common';
import { Query, Param } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import validator from 'validator';

import { AdminNonBlockGuard } from '../admin/admin.nonblock.guard';

import { DBConnService } from '../db/db.conn.service';

import { AdminSession } from '../db/entity/AdminSession';
import { Category } from '../db/entity/Category';
import { PostItem, PostItemAccessLevel } from '../db/entity/PostItem';

import { SlugRegex } from '../helper/Regex';

@Controller()
@UseGuards(AdminNonBlockGuard)
export class ViewPostController {
	constructor(private conn: DBConnService) {}

	@Get('posts')
	async listPosts(
		@Session() session: AdminSession,
		@Query('category') category: string,
		@Query('before') before: string,
		@Query('after') after: string
	): Promise<{ posts: PostItem[]; hasBefore: boolean; hasAfter: boolean }> {
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
					select: ['id'],
				});

				if (!categoryEntity)
					throw new BadRequestException('category not exists');
			}

			let anchor: { createdAt: string } | undefined = undefined;

			if (before || after) {
				let query = mgr
					.createQueryBuilder(PostItem, 'PostItem')
					.select(['PostItem.createdAt'])
					.where('PostItem.content IS NOT NULL');

				if (categoryEntity)
					query = query.andWhere('PostItem.category = :category', {
						category: categoryEntity.id,
					});

				if (!session)
					query = query.andWhere(
						'PostItem.accessLevel = :accessLevel',
						{
							accessLevel: PostItemAccessLevel.PUBLIC,
						}
					);

				anchor = await query
					.andWhere('PostItem.slug = :slug', {
						slug: before || after,
					})
					.getRawOne();

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
					'Category.name',
				])
				.where('PostItem.content IS NOT NULL');

			if (categoryEntity)
				query = query.andWhere('PostItem.category = :category', {
					category: categoryEntity.id,
				});

			// Anonymous users only can see public posts.
			if (!session)
				query = query.andWhere('PostItem.accessLevel = :accessLevel', {
					accessLevel: PostItemAccessLevel.PUBLIC,
				});

			let unlimitedQuery = query
				.clone()
				.select(['PostItem.id'])
				.orderBy('PostItem.createdAt', 'DESC');
			const unlimitedCount = await unlimitedQuery.getCount();

			if (anchor)
				query = query.andWhere(
					`PostItem.createdAt ${before ? '<' : '>'} :createdAt`,
					{ createdAt: anchor.createdAt }
				);

			query = query.orderBy('PostItem.createdAt', after ? 'ASC' : 'DESC');

			let posts = await query.limit(20).getRawMany();

			if (after) posts = posts.reverse();

			const hasBefore =
				unlimitedCount !== 0 &&
				((posts.length === 0 && !before) ||
					(posts.length !== 0 &&
						(await unlimitedQuery
							.clone()
							.andWhere('PostItem.createdAt < :createdAt', {
								createdAt: posts[posts.length - 1].createdAt,
							})
							.getCount()) !== 0));
			const hasAfter =
				unlimitedCount !== 0 &&
				((posts.length === 0 && !after) ||
					(posts.length !== 0 &&
						(await unlimitedQuery
							.andWhere('PostItem.createdAt > :createdAt', {
								createdAt: posts[0].createdAt,
							})
							.getCount()) !== 0));

			return {
				posts,
				hasBefore,
				hasAfter,
			};
		});
	}

	@Get('posts/:slug')
	async getPost(
		@Session() session: AdminSession,
		@Param('slug') slug: string
	) {
		if (!slug || !(slug = slug.trim()))
			throw new BadRequestException('slug required');

		if (!SlugRegex.test(slug)) throw new BadRequestException('bad slug');

		let query = this.conn.conn.manager
			.createQueryBuilder(PostItem, 'PostItem')
			.leftJoin('PostItem.category', 'Category')
			.leftJoin('PostItem.images', 'PostItemImage')
			.select([
				'PostItem.accessLevel',
				'PostItem.title',
				'PostItem.content',
				'PostItem.htmlContent',
				'PostItem.createdAt',
				'PostItem.modifiedAt',
				'PostItem.category',
				'Category.name',
				'PostItemImage.index',
				'PostItemImage.width',
				'PostItemImage.height',
				'PostItemImage.hash',
				'PostItemImage.url',
				'PostItemImage.createdAt',
			])
			.where('PostItem.content IS NOT NULL');

		// Anonymous users cannot see private posts.
		if (!session)
			query = query.andWhere('PostItem.accessLevel != :accessLevel', {
				accessLevel: PostItemAccessLevel.PRIVATE,
			});

		const post = await query
			.andWhere('PostItem.slug = :slug', { slug })
			.orderBy('PostItemImage.index', 'ASC')
			.getOne();

		if (!post) throw new NotFoundException('no post found');

		return post;
	}
}
