import { Controller, UseGuards, Session } from '@nestjs/common';
import { Get } from '@nestjs/common';
import { Query, Param } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

import { AdminNonBlockGuard } from '../admin/admin.nonblock.guard';

import { DBConnService } from '../db/db.conn.service';

import { OptionalPipe } from '../helper/OptionalPipe';
import { SlugPipe } from '../helper/SlugPipe';
import { StringPipe } from '../helper/StringPipe';

import { AdminSession } from '../db/entity/AdminSession';
import { Category } from '../db/entity/Category';
import { PostItem, PostItemAccessLevel } from '../db/entity/PostItem';

@Controller()
@UseGuards(AdminNonBlockGuard)
export class ViewPostController {
	private readonly urlRegex = /^https?:(?:\/\/)?(?:\w[\w-]+\w|\w{1,2})(?:\.(?:\w[\w-]+\w|\w{1,2}))*\//;

	constructor(
		private es: ElasticsearchService,
		private conn: DBConnService
	) {}

	@Get('posts')
	async listPosts(
		@Session() session: AdminSession,
		@Query('query', new OptionalPipe(new StringPipe()))
		query: string | undefined,
		@Query('category', new OptionalPipe(new StringPipe(32)))
		category: string | undefined,
		@Query('before', new OptionalPipe(new StringPipe(256), new SlugPipe()))
		before: string | undefined,
		@Query('after', new OptionalPipe(new StringPipe(256), new SlugPipe()))
		after: string | undefined
	): Promise<{ posts: PostItem[]; hasBefore: boolean; hasAfter: boolean }> {
		if (
			query !== undefined &&
			(category !== undefined ||
				before !== undefined ||
				after !== undefined)
		)
			throw new BadRequestException('query cannot coexist with others');

		if (before !== undefined && after !== undefined)
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

				if (process.env.CDN_BASE_URL)
					for (const post of posts) {
						if (!post.thumbnail) continue;

						post.thumbnail.url = post.thumbnail.url.replace(
							this.urlRegex,
							process.env.CDN_BASE_URL
						);
					}

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

			posts = posts.map((post) => {
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
				) {
					post.thumbnail = {
						width: post.thumbnailWidth,
						height: post.thumbnailHeight,
						hash: post.thumbnailHash,
						url: post.thumbnailUrl,
					};
				} else post.thumbnail = null;

				post.thumbnailWidth = undefined;
				post.thumbnailHeight = undefined;
				post.thumbnailHash = undefined;
				post.thumbnailUrl = undefined;

				return post;
			});

			if (process.env.CDN_BASE_URL)
				for (const post of posts) {
					if (!post.thumbnail) continue;

					post.thumbnail.url = post.thumbnail.url.replace(
						this.urlRegex,
						process.env.CDN_BASE_URL
					);
				}

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
		@Param('slug', new StringPipe(256), SlugPipe) slug: string
	): Promise<PostItem> {
		let query = this.conn.conn.manager
			.createQueryBuilder(PostItem, 'PostItem')
			.leftJoin('PostItem.category', 'Category')
			.leftJoin('PostItem.images', 'PostItemImage')
			.leftJoin('PostItem.videos', 'PostItemVideo')
			.leftJoin('PostItem.thumbnail', 'PostItemThumbnail')
			.select([
				'PostItem.accessLevel',
				'PostItem.title',
				'PostItem.content',
				'PostItem.contentPreview',
				'PostItem.htmlContent',
				'PostItem.imageCount',
				'PostItem.videoCount',
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
				'PostItemVideo.index',
				'PostItemVideo.url',
				'PostItemVideo.createdAt',
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
			.addOrderBy('PostItemVideo.index', 'ASC')
			.getOne();

		if (!post) throw new NotFoundException('no post found');

		if (process.env.CDN_BASE_URL) {
			if (post.thumbnail)
				post.thumbnail.url = post.thumbnail.url.replace(
					this.urlRegex,
					process.env.CDN_BASE_URL
				);

			for (const image of post.images)
				image.url = image.url.replace(
					this.urlRegex,
					process.env.CDN_BASE_URL
				);
		}

		return post;
	}
}
