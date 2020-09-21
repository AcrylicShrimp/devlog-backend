import { Controller, UseGuards, Req } from '@nestjs/common';
import { Post, Put, Delete, Patch } from '@nestjs/common';
import { Param, Body } from '@nestjs/common';
import {
	BadRequestException,
	ConflictException,
	NotFoundException,
} from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import formidable from 'formidable';
import { S3 } from 'aws-sdk';
import { encode } from 'blurhash';
import { Request } from 'express';
import sharp from 'sharp';
import { QueryFailedError } from 'typeorm';
import validator from 'validator';

import { AdminGuard } from './admin.guard';

import { AuthTokenService } from '../auth/auth.token.service';
import { DBConnService } from '../db/db.conn.service';

import { Category } from '../db/entity/Category';
import { PostItem, PostItemAccessLevel } from '../db/entity/PostItem';
import { PostItemImage } from '../db/entity/PostItemImage';
import { PostItemThumbnail } from '../db/entity/PostItemThumbnail';

import { asEnum, isEnum } from '../helper/Enum';
import {
	parseAsPlain,
	parseAsHTMLWithImage,
	parseAsText,
} from '../helper/MDRenderer';
import { SlugRegex } from '../helper/Regex';

@Controller()
@UseGuards(AdminGuard)
export class AdminPostController {
	private s3: S3;

	constructor(
		private es: ElasticsearchService,
		private token: AuthTokenService,
		private conn: DBConnService
	) {
		this.s3 = new S3({
			apiVersion: '2006-03-01',
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			region: process.env.AWS_REGION!,
		});
	}

	@Post('admin/posts')
	async newPost(
		@Body('slug') slug: string,
		@Body('access-level') accessLevel: string,
		@Body('category') category: string,
		@Body('title') title: string
	): Promise<void> {
		if (!slug || !(slug = slug.trim()))
			throw new BadRequestException('slug required');

		if (!SlugRegex.test(slug)) throw new BadRequestException('bad slug');

		if (!accessLevel || !(accessLevel = accessLevel.trim()))
			throw new BadRequestException('access-level required');

		if (!isEnum(PostItemAccessLevel, accessLevel))
			throw new BadRequestException('bad access-level');

		if (category !== undefined) {
			category = (category ?? '').trim();

			if (category && !validator.isLength(category, { max: 32 }))
				throw new BadRequestException('category too long');
		}

		if (!title || !(title = title.trim()))
			throw new BadRequestException('title required');

		if (!validator.isLength(title, { max: 128 }))
			throw new BadRequestException('title too long');

		await this.conn.conn.transaction(async (mgr) => {
			let categoryEntity: Category | undefined = undefined;

			if (category) {
				categoryEntity = await mgr.findOne(Category, {
					where: { name: category },
					select: ['id'],
				});

				if (!categoryEntity)
					throw new BadRequestException('category not exists');
			}

			const post = new PostItem();
			post.uuid = await this.token.generateShort();
			post.slug = slug;
			post.accessLevel = asEnum(PostItemAccessLevel, accessLevel);
			post.category = categoryEntity;
			post.title = title;

			try {
				await mgr.save(post);
			} catch (err) {
				if (err instanceof QueryFailedError)
					throw new ConflictException('slug already taken');

				throw err;
			}
		});
	}

	@Delete('admin/posts/:slug')
	async deletePost(@Param('slug') slug: string): Promise<void> {
		if (!slug || !(slug = slug.trim()))
			throw new BadRequestException('slug required');

		if (!SlugRegex.test(slug)) throw new BadRequestException('bad slug');

		await this.conn.conn.transaction(async (mgr) => {
			const post = await mgr
				.createQueryBuilder(PostItem, 'PostItem')
				.leftJoin('PostItem.images', 'PostItemImage')
				.leftJoin('PostItem.thumbnail', 'PostItemThumbnail')
				.where('PostItem.slug = :slug', { slug })
				.select([
					'PostItem.id',
					'PostItem.uuid',
					'PostItemImage.id',
					'PostItemImage.uuid',
					'PostItemThumbnail.id',
				])
				.getOne();

			if (!post) throw new NotFoundException('no post found');

			if (post.thumbnail)
				try {
					await this.s3
						.deleteObjects({
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							Bucket: process.env.AWS_S3_BUCKET_NAME!,
							Delete: {
								Objects: [
									{
										Key: `${post.uuid}/__thumbnail`,
									},
								],
							},
						})
						.promise();
				} catch {}

			for (let index = 0; index < post.images.length; index += 1000)
				try {
					await this.s3
						.deleteObjects({
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							Bucket: process.env.AWS_S3_BUCKET_NAME!,
							Delete: {
								Objects: post.images
									.slice(index, index + 1000)
									.map((image) => {
										return {
											Key: `${post.uuid}/${image.uuid}`,
										};
									}),
							},
						})
						.promise();
				} catch {}

			if (post.thumbnail) mgr.remove(post.thumbnail);
			mgr.remove(post.images);
			mgr.remove(post);

			if (
				(await this.es.exists({ id: slug, index: 'devlog-posts' })).body
			)
				await this.es.delete({ id: slug, index: 'devlog-posts' });
		});
	}

	@Patch('admin/posts/:slug')
	async updatePost(
		@Param('slug') slug: string,
		@Body('new-slug') newSlug?: string,
		@Body('new-access-level') newAccessLevel?: string,
		@Body('new-category') newCategory?: string,
		@Body('new-title') newTitle?: string
	): Promise<void> {
		if (!slug || !(slug = slug.trim()))
			throw new BadRequestException('slug required');

		if (!SlugRegex.test(slug)) throw new BadRequestException('bad slug');

		if (newSlug !== undefined) {
			if (!newSlug || !(newSlug = newSlug.trim()))
				throw new BadRequestException('invalid new-slug');

			if (!SlugRegex.test(newSlug))
				throw new BadRequestException('bad new-slug');
		}

		if (newAccessLevel !== undefined) {
			if (!newAccessLevel || !(newAccessLevel = newAccessLevel.trim()))
				throw new BadRequestException('invalid new-access-level');

			if (!isEnum(PostItemAccessLevel, newAccessLevel))
				throw new BadRequestException('bad new-access-level');
		}

		if (newCategory !== undefined) {
			newCategory = (newCategory ?? '').trim();

			if (newCategory && !validator.isLength(newCategory, { max: 32 }))
				throw new BadRequestException('new-category too long');
		}

		if (newTitle !== undefined) {
			if (!newTitle || !(newTitle = newTitle.trim()))
				throw new BadRequestException('new-title required');

			if (!validator.isLength(newTitle, { max: 128 }))
				throw new BadRequestException('new-title too long');
		}

		if (!newSlug && !newAccessLevel && newCategory == null && !newTitle)
			throw new BadRequestException('no changes');

		await this.conn.conn.transaction(async (mgr) => {
			const post = await mgr.findOne(PostItem, {
				where: { slug },
				select: ['id'],
			});

			if (!post) throw new NotFoundException('post not exists');

			const partialPost = {};

			if (newSlug)
				Object.assign(partialPost, {
					slug: newSlug,
				});

			if (newAccessLevel)
				Object.assign(partialPost, {
					accessLevel: newAccessLevel,
				});

			if (newCategory) {
				const categoryEntity = await mgr.findOne(Category, {
					where: { name: newCategory },
					select: ['id'],
				});

				if (!categoryEntity)
					throw new BadRequestException('category not exists');

				Object.assign(partialPost, {
					category: categoryEntity,
				});
			} else if (newCategory != null)
				Object.assign(partialPost, {
					category: undefined,
				});

			if (newTitle)
				Object.assign(partialPost, {
					title: newTitle,
				});

			try {
				await mgr.update(PostItem, post.id, partialPost);
			} catch (err) {
				if (err instanceof QueryFailedError)
					throw new ConflictException('slug already taken');

				throw err;
			}

			const query = await mgr
				.createQueryBuilder(PostItem, 'PostItem')
				.where('PostItem.id = :id', { id: post.id })
				.andWhere('PostItem.content IS NOT NULL')
				.leftJoin('PostItem.category', 'Category')
				.select([
					'PostItem.accessLevel',
					'PostItem.title',
					'Category.name',
				]);

			if (newSlug)
				query.select([
					'PostItem.slug',
					'PostItem.accessLevel',
					'PostItem.title',
					'PostItem.content',
					'PostItem.createdAt',
					'Category.name',
				]);

			const updatedPost = await query.getOne();

			if (updatedPost) {
				if (newSlug) {
					if (
						(
							await this.es.exists({
								id: slug,
								index: 'devlog-posts',
							})
						).body
					)
						await this.es.delete({
							id: slug,
							index: 'devlog-posts',
						});

					await this.es.create({
						id: updatedPost.slug,
						index: 'devlog-posts',
						body: {
							accessLevel: updatedPost.accessLevel,
							category: updatedPost.category?.name || '',
							title: updatedPost.title,
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							content: await parseAsText(updatedPost.content!),
							createdAt: updatedPost.createdAt,
						},
					});
				} else
					await this.es.update({
						id: updatedPost.slug,
						index: 'devlog-posts',
						body: {
							doc: {
								accessLevel: updatedPost.accessLevel,
								category: updatedPost.category?.name || '',
								title: updatedPost.title,
							},
						},
					});
			}
		});
	}

	@Post('admin/posts/:slug/images')
	async newPostImage(
		@Req() req: Request,
		@Param('slug') slug: string
	): Promise<number[]> {
		if (!slug || !(slug = slug.trim()))
			throw new BadRequestException('slug required');

		if (!SlugRegex.test(slug)) throw new BadRequestException('bad slug');

		return await this.conn.conn.transaction(async (mgr) => {
			const post = await mgr.findOne(PostItem, {
				where: { slug },
				select: ['id', 'uuid', 'imageCount'],
			});

			if (!post) throw new NotFoundException('post not exists');

			const files = await new Promise<formidable.Files>(
				(resolve, reject) =>
					new formidable.IncomingForm({
						multiples: true,
					}).parse(req, (err, _, files) =>
						err ? reject(err) : resolve(files)
					)
			);

			if (!files['images']) return [];

			const images = Array.isArray(files['images'])
				? files['images']
				: [files['images']];

			const processedImages = await Promise.all(
				images.map(async (image) => {
					const imageId = await this.token.generateShort();
					const imageTransform = sharp(image.path, {
						pages: -1,
					}).rotate();

					const { width, height } = await imageTransform.metadata();

					const imageTransformForUpload = imageTransform
						.clone()
						.webp({ lossless: true })
						.withMetadata();

					if (!width || !height)
						return {
							id: imageId,
							image: imageTransformForUpload,
							width: 0,
							height: 0,
							hash: '',
						};

					const maxDim = Math.max(width, height);
					const minComponentCount = Math.round(
						Math.min(width, height) / Math.floor(maxDim / 5)
					);

					if (minComponentCount) {
						let resizedWidth: number;
						let resizedHeight: number;

						if (maxDim === width) {
							resizedWidth = 100;
							resizedHeight = Math.round((100 / width) * height);
						} else {
							resizedWidth = Math.round((100 / height) * width);
							resizedHeight = 100;
						}

						const componentX =
							maxDim === width ? 5 : minComponentCount;
						const componentY =
							maxDim === width ? minComponentCount : 5;

						return {
							id: imageId,
							image: imageTransformForUpload,
							width,
							height,
							hash: encode(
								Uint8ClampedArray.from(
									await imageTransform
										.clone()
										.resize(
											maxDim === width
												? { width: 100 }
												: { height: 100 }
										)
										.ensureAlpha()
										.toFormat('raw')
										.toBuffer()
								),
								resizedWidth,
								resizedHeight,
								componentX,
								componentY
							),
						};
					}

					return {
						id: imageId,
						image: imageTransformForUpload,
						width,
						height,
						hash: '',
					};
				})
			);

			const uploads = processedImages.map(
				(processedImage) =>
					new S3.ManagedUpload({
						service: this.s3,
						params: {
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							Bucket: process.env.AWS_S3_BUCKET_NAME!,
							Key: `${post.uuid}/${processedImage.id}`,
							ACL: 'private',
							Body: processedImage.image,
							ContentType: 'image/webp',
						},
					})
			);

			try {
				const uploadResults = await Promise.all(
					uploads.map((upload) => upload.promise())
				);

				await mgr.update(PostItem, post.id, {
					imageCount: post.imageCount + processedImages.length,
				});

				const images = await Promise.all(
					processedImages.map((processedImage, index) => {
						const postImage = new PostItemImage();
						postImage.uuid = processedImage.id;
						postImage.index = post.imageCount + index;
						postImage.width = processedImage.width;
						postImage.height = processedImage.height;
						postImage.hash = processedImage.hash;
						(postImage.url = uploadResults[index].Location),
							(postImage.post = post);

						return mgr.save(postImage);
					})
				);

				return images.map((image) => image.index);
			} catch (err) {
				uploads.forEach((upload) => upload.abort());

				for (
					let index = 0;
					index < processedImages.length;
					index += 1000
				)
					this.s3
						.deleteObjects({
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							Bucket: process.env.AWS_S3_BUCKET_NAME!,
							Delete: {
								Objects: processedImages
									.slice(index, index + 1000)
									.map((processedImage) => ({
										Key: `${post.uuid}/${processedImage.id}`,
									})),
							},
						})
						.promise()
						.catch();

				throw err;
			}
		});
	}

	@Delete('admin/posts/:slug/images/:index')
	async deletePostImage(
		@Param('slug') slug: string,
		@Param('index') index: string
	): Promise<void> {
		if (!slug || !(slug = slug.trim()))
			throw new BadRequestException('slug required');

		if (!SlugRegex.test(slug)) throw new BadRequestException('bad slug');

		if (!index || !(index = index.trim()))
			throw new BadRequestException('index required');

		if (!validator.isNumeric(index))
			throw new BadRequestException('index must be a integer');

		await this.conn.conn.transaction(async (mgr) => {
			const post = await mgr.findOne(PostItem, {
				where: { slug },
				select: ['id', 'uuid'],
			});

			if (!post) throw new NotFoundException('post not exists');

			const image = await mgr.findOne(PostItemImage, {
				where: { post, index: parseInt(index) },
				select: ['id', 'uuid'],
			});

			if (!image) throw new NotFoundException('image not exists');

			try {
				await this.s3
					.deleteObjects({
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						Bucket: process.env.AWS_S3_BUCKET_NAME!,
						Delete: {
							Objects: [
								{
									Key: `${post.uuid}/${image.uuid}`,
								},
							],
						},
					})
					.promise();
			} catch {}

			await mgr.remove(image);
		});
	}

	@Put('admin/posts/:slug/thumbnail')
	async putPostThumbnail(
		@Req() req: Request,
		@Param('slug') slug: string
	): Promise<void> {
		if (!slug || !(slug = slug.trim()))
			throw new BadRequestException('slug required');

		if (!SlugRegex.test(slug)) throw new BadRequestException('bad slug');

		await this.conn.conn.transaction(async (mgr) => {
			const post = await mgr
				.createQueryBuilder(PostItem, 'PostItem')
				.where('PostItem.slug = :slug', { slug })
				.leftJoin('PostItem.thumbnail', 'PostItemThumbnail')
				.select([
					'PostItem.id',
					'PostItem.uuid',
					'PostItemThumbnail.id',
				])
				.getOne();

			if (!post) throw new NotFoundException('post not exists');

			const files = await new Promise<formidable.Files>(
				(resolve, reject) =>
					new formidable.IncomingForm().parse(req, (err, _, files) =>
						err ? reject(err) : resolve(files)
					)
			);

			if (!files['image']) return;

			const image = Array.isArray(files['image'])
				? files['image'][0]
				: files['image'];

			const processedImage = await (async () => {
				const imageTransform = sharp(image.path, {
					pages: 1,
				}).rotate();

				const { width, height } = await imageTransform.metadata();

				const imageTransformForUpload = imageTransform
					.clone()
					.webp({ quality: 100 })
					.withMetadata();

				if (!width || !height)
					return {
						image: imageTransformForUpload,
						width: 0,
						height: 0,
						hash: '',
					};

				const maxDim = Math.max(width, height);
				const minComponentCount = Math.round(
					Math.min(width, height) / Math.floor(maxDim / 5)
				);

				const [resizedImageWidth, resizedImageHeight] =
					width <= 1024 && height <= 1024
						? [width, height]
						: width < height
						? [Math.ceil((1024 * width) / height), 1024]
						: [1024, Math.ceil((1024 * height) / width)];

				const resizedImageTransformForUpload = imageTransformForUpload.resize(
					resizedImageWidth,
					resizedImageHeight
				);

				if (minComponentCount) {
					let resizedWidth: number;
					let resizedHeight: number;

					if (maxDim === width) {
						resizedWidth = 100;
						resizedHeight = Math.round((100 / width) * height);
					} else {
						resizedWidth = Math.round((100 / height) * width);
						resizedHeight = 100;
					}

					const componentX = maxDim === width ? 5 : minComponentCount;
					const componentY = maxDim === width ? minComponentCount : 5;

					return {
						image: resizedImageTransformForUpload,
						width: resizedImageWidth,
						height: resizedImageHeight,
						hash: encode(
							Uint8ClampedArray.from(
								await imageTransform
									.clone()
									.resize(
										maxDim === width
											? { width: 100 }
											: { height: 100 }
									)
									.ensureAlpha()
									.toFormat('raw')
									.toBuffer()
							),
							resizedWidth,
							resizedHeight,
							componentX,
							componentY
						),
					};
				}

				return {
					image: resizedImageTransformForUpload,
					width: resizedImageWidth,
					height: resizedImageHeight,
					hash: '',
				};
			})();

			const upload = new S3.ManagedUpload({
				service: this.s3,
				params: {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					Bucket: process.env.AWS_S3_BUCKET_NAME!,
					Key: `${post.uuid}/__thumbnail`,
					ACL: 'private',
					Body: processedImage.image,
					ContentType: 'image/webp',
				},
			});

			try {
				const uploadResult = await upload.promise();

				if (post.thumbnail) await mgr.remove(post.thumbnail);

				const postThumbnail = new PostItemThumbnail();
				postThumbnail.width = processedImage.width;
				postThumbnail.height = processedImage.height;
				postThumbnail.hash = processedImage.hash;
				postThumbnail.url = uploadResult.Location;
				await mgr.save(postThumbnail);

				await mgr.update(PostItem, post.id, {
					thumbnail: postThumbnail,
				});
			} catch (err) {
				upload.abort();

				await this.s3
					.deleteObjects({
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						Bucket: process.env.AWS_S3_BUCKET_NAME!,
						Delete: {
							Objects: [{ Key: `${post.uuid}/__thumbnail` }],
						},
					})
					.promise()
					.catch();

				throw err;
			}
		});
	}

	@Delete('admin/posts/:slug/thumbnail')
	async deletePostThumbnail(@Param('slug') slug: string): Promise<void> {
		if (!slug || !(slug = slug.trim()))
			throw new BadRequestException('slug required');

		if (!SlugRegex.test(slug)) throw new BadRequestException('bad slug');

		await this.conn.conn.transaction(async (mgr) => {
			const post = await mgr
				.createQueryBuilder(PostItem, 'PostItem')
				.where('PostItem.slug = :slug', { slug })
				.leftJoin('PostItem.thumbnail', 'PostItemThumbnail')
				.select([
					'PostItem.id',
					'PostItem.uuid',
					'PostItemThumbnail.id',
				])
				.getOne();

			if (!post) throw new NotFoundException('post not exists');

			if (post.thumbnail) await mgr.remove(post.thumbnail);

			try {
				await this.s3
					.deleteObjects({
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						Bucket: process.env.AWS_S3_BUCKET_NAME!,
						Delete: {
							Objects: [{ Key: `${post.uuid}/__thumbnail` }],
						},
					})
					.promise();
			} catch {}
		});
	}

	@Put('admin/posts/:slug/content')
	async putPostContent(
		@Param('slug') slug: string,
		@Body('content') content: string
	): Promise<void> {
		if (!slug || !(slug = slug.trim()))
			throw new BadRequestException('slug required');

		if (!SlugRegex.test(slug)) throw new BadRequestException('bad slug');

		if (!content || !(content = content.trim()))
			throw new BadRequestException('content required');

		await this.conn.conn.transaction(async (mgr) => {
			const post = await mgr
				.createQueryBuilder(PostItem, 'PostItem')
				.leftJoin('PostItem.images', 'PostItemImage')
				.select([
					'PostItem.id',
					'PostItemImage.index',
					'PostItemImage.url',
				])
				.where('PostItem.slug = :slug', { slug })
				.getOne();

			if (!post) throw new NotFoundException('post not exists');

			const postImage: { [key: number]: string } = {};

			post.images.forEach(
				(image) => (postImage[image.index] = image.url)
			);

			// Slice some beginning content and cutout a broken HTML entity if any.
			const contentPreview = (await parseAsPlain(content))
				.slice(0, 256)
				.replace(/\s*&[^\s;]*$/, '');

			await mgr.update(PostItem, post.id, {
				content,
				contentPreview,
				htmlContent: await parseAsHTMLWithImage(content, postImage),
			});

			if (
				(await this.es.exists({ id: slug, index: 'devlog-posts' })).body
			)
				await this.es.update({
					id: slug,
					index: 'devlog-posts',
					body: {
						doc: {
							content: await parseAsText(content),
						},
					},
				});
			else {
				const updatedPost = await mgr
					.createQueryBuilder(PostItem, 'PostItem')
					.where('PostItem.id = :id', { id: post.id })
					.leftJoin('PostItem.category', 'Category')
					.select([
						'PostItem.accessLevel',
						'PostItem.title',
						'PostItem.createdAt',
						'Category.name',
					])
					.getOne();

				await this.es.create({
					id: slug,
					index: 'devlog-posts',
					body: {
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						accessLevel: updatedPost!.accessLevel,
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						category: updatedPost!.category?.name || '',
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						title: updatedPost!.title,
						content: await parseAsText(content),
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						createdAt: updatedPost!.createdAt,
					},
				});
			}
		});
	}
}
