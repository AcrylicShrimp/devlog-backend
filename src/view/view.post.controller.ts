import { Controller, UseGuards, Session } from '@nestjs/common';
import { Get } from '@nestjs/common';
import { Query, Param } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
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
	constructor(
		private es: ElasticsearchService,
		private conn: DBConnService
	) {}

	@Get('posts')
	async listPosts(
		@Session() session: AdminSession,
		@Query('query') query: string,
		@Query('category') category: string,
		@Query('before') before: string,
		@Query('after') after: string
	): Promise<{ posts: PostItem[]; hasBefore: boolean; hasAfter: boolean }> {
		if (query !== undefined) {
			if (!query || !(query = query.trim()))
				throw new BadRequestException('invalid query');
		}

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

		if (query && (category || before || after))
			throw new BadRequestException('query cannot coexist with others');

		if (before && after)
			throw new BadRequestException('before and after cannot coexist');

		if (query !== undefined)
			return await this.conn.conn.transaction(async (mgr) => {
				let booleanQuery = {
					must: {
						multi_match: {
							query,
							fields: [
								'title',
								'title.unicode',
								'title.english',
								'title.korean',
								'title.japanese',
								'title.chinese',
								'content',
								'content.unicode',
								'content.english',
								'content.korean',
								'content.japanese',
								'content.chinese',
							],
						},
					},
				};

				if (!session)
					booleanQuery = Object.assign(booleanQuery, {
						filter: { term: { accessLevel: 'public' } },
					});

				const result = await this.es.search({
					index: 'devlog-posts',
					from: 0,
					size: 10000,
					_source: 'false',
					body: {
						query: {
							bool: booleanQuery,
						},
					},
				});

				const posts = (
					await Promise.all<PostItem | undefined>(
						result.body.hits.hits.map(
							(hit: {
								_id: string;
							}): Promise<PostItem | undefined> =>
								mgr
									.createQueryBuilder(PostItem, 'PostItem')
									.where('PostItem.slug = :slug', {
										slug: hit._id,
									})
									.andWhere('PostItem.content IS NOT NULL')
									.leftJoin('PostItem.category', 'Category')
									.leftJoin(
										'PostItem.thumbnail',
										'PostItemThumbnail'
									)
									.select([
										'PostItem.slug',
										'PostItem.accessLevel',
										'PostItem.title',
										'PostItem.contentPreview',
										'PostItem.createdAt',
										'PostItem.modifiedAt',
										'Category.name',
										'PostItemThumbnail.width',
										'PostItemThumbnail.height',
										'PostItemThumbnail.hash',
										'PostItemThumbnail.url',
									])
									.getOne()
						)
					)
				).filter((post): post is PostItem => !!post);

				return {
					posts,
					hasBefore: false,
					hasAfter: false,
				};
			});

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
					.select('PostItem.createdAt', 'createdAt')
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
				.leftJoin('PostItem.thumbnail', 'PostItemThumbnail')
				.select('PostItem.slug', 'slug')
				.addSelect('PostItem.accessLevel', 'accessLevel')
				.addSelect('PostItem.title', 'title')
				.addSelect('PostItem.contentPreview', 'contentPreview')
				.addSelect('PostItem.createdAt', 'createdAt')
				.addSelect('PostItem.modifiedAt', 'modifiedAt')
				.addSelect('Category.name', 'category')
				.addSelect('PostItemThumbnail.width', 'thumbnailWidth')
				.addSelect('PostItemThumbnail.height', 'thumbnailHeight')
				.addSelect('PostItemThumbnail.hash', 'thumbnailHash')
				.addSelect('PostItemThumbnail.url', 'thumbnailUrl')
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

			const unlimitedQuery = query
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

			let posts = (await query.limit(20).getRawMany()).map((post) => {
				if (post.category)
					post.category = {
						name: post.category,
					};

				post.createdAt = new Date(post.createdAt);
				post.modifiedAt = new Date(post.modifiedAt);

				if (
					post.thumbnailWidth ||
					post.thumbnailHeight ||
					post.thumbnailHash ||
					post.thumbnailUrl
				)
					post.thumbnail = {
						width: post.thumbnailWidth,
						height: post.thumbnailHeight,
						hash: post.thumbnailHash,
						url: post.thumbnailUrl,
					};
				else post.thumbnail = null;

				post.thumbnailWidth = undefined;
				post.thumbnailHeight = undefined;
				post.thumbnailHash = undefined;
				post.thumbnailUrl = undefined;

				return post;
			});

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
	): Promise<PostItem> {
		if (!slug || !(slug = slug.trim()))
			throw new BadRequestException('slug required');

		if (!SlugRegex.test(slug)) throw new BadRequestException('bad slug');

		let query = this.conn.conn.manager
			.createQueryBuilder(PostItem, 'PostItem')
			.leftJoin('PostItem.category', 'Category')
			.leftJoin('PostItem.images', 'PostItemImage')
			.leftJoin('PostItem.thumbnail', 'PostItemThumbnail')
			.select([
				'PostItem.accessLevel',
				'PostItem.title',
				'PostItem.content',
				'PostItem.contentPreview',
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
				'PostItemThumbnail.width',
				'PostItemThumbnail.height',
				'PostItemThumbnail.hash',
				'PostItemThumbnail.url',
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
