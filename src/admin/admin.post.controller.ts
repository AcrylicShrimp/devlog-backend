import { Controller, UseGuards, Req } from '@nestjs/common';
import { Get, Post, Put, Delete } from '@nestjs/common';
import { Param, Body } from '@nestjs/common';
import {
	BadRequestException,
	ConflictException,
	NotFoundException
} from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { encode } from 'blurhash';
import dompurify from 'dompurify';
import { Request } from 'express';
import hljs from 'highlight.js';
import { JSDOM } from 'jsdom';
import { Renderer, parse } from 'marked';
import sharp from 'sharp';
import { QueryFailedError } from 'typeorm';
import validator from 'validator';

import { AdminGuard } from './admin.guard';

import { AuthTokenService } from '../auth/auth.token.service';
import { DBConnService } from '../db/db.conn.service';

import { Category } from '../db/entity/Category';
import { PostItem, PostItemAccessLevel } from '../db/entity/PostItem';
import { PostItemImage } from '../db/entity/PostItemImage';

import { asEnum, isEnum } from '../helper/Enum';
import { SlugRegex } from '../helper/Regex';

@Controller()
@UseGuards(AdminGuard)
export class AdminPostController {
	private s3: S3;

	constructor(private token: AuthTokenService, private conn: DBConnService) {
		this.s3 = new S3({
			apiVersion: '2006-03-01',
			accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
			region: process.env.AWS_REGION!
		});
	}

	@Get('admin/posts')
	async listPosts(): Promise<PostItem[]> {
		return this.conn.conn.manager
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
			.orderBy('PostItem.modifiedAt', 'DESC')
			.limit(20)
			.getMany();
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

		if (!category || !(category = category.trim()))
			throw new BadRequestException('category required');

		if (!validator.isLength(category, { max: 32 }))
			throw new BadRequestException('category too long');

		if (!title || !(title = title.trim()))
			throw new BadRequestException('title required');

		if (!validator.isLength(title, { max: 128 }))
			throw new BadRequestException('title too long');

		await this.conn.conn.transaction(async (mgr) => {
			const categoryEntity = await mgr.findOne(Category, {
				where: { name: category },
				select: ['id']
			});

			if (!categoryEntity)
				throw new BadRequestException('category not exists');

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

	@Post('admin/posts/:slug/images')
	async newPostImage(
		@Req() req: Request,
		@Param('slug') slug: string
	): Promise<number[]> {
		if (!req.busboy)
			throw new BadRequestException('only multipart/formdata allowed');

		if (!slug || !(slug = slug.trim()))
			throw new BadRequestException('slug required');

		if (!SlugRegex.test(slug)) throw new BadRequestException('bad slug');

		return await this.conn.conn.transaction(async (mgr) => {
			const post = await mgr.findOne(PostItem, {
				where: { slug },
				select: ['id', 'uuid', 'imageCount']
			});

			if (!post) throw new NotFoundException('post not exists');

			interface ImageUpload {
				upload: S3.ManagedUpload;
				promise: Promise<void | S3.ManagedUpload.SendData>;
			}
			interface ImageMeta {
				width: number;
				height: number;
				hash: string;
			}

			let error: any = undefined;
			const imageIds: string[] = [];
			const imageUploads: ImageUpload[] = [];
			const imageMetas: Promise<void | ImageMeta>[] = [];

			const abort = () => {
				imageUploads.forEach((imageUpload) =>
					imageUpload.upload.abort()
				);

				for (let index = 0; index < imageIds!.length; index += 1000)
					this.s3
						.deleteObjects({
							Bucket: process.env.AWS_S3_BUCKET_NAME!,
							Delete: {
								Objects: imageIds!
									.slice(index, index + 1000)
									.map((imageId) => {
										return {
											Key: `${post.uuid}/${imageId}`
										};
									})
							}
						})
						.promise()
						.catch();
			};

			req.busboy.on('file', async (_, body, filename, encoding, mime) => {
				if (error) {
					body.resume();
					return;
				}

				const imageId = await this.token.generateShort();
				const image = body.pipe(sharp().rotate());

				const upload = new S3.ManagedUpload({
					service: this.s3,
					params: {
						Bucket: process.env.AWS_S3_BUCKET_NAME!,
						Key: `${post.uuid}/${imageId}`,
						ACL: 'private',
						Body: image.clone().withMetadata(),
						ContentType: mime
					}
				});

				imageIds.push(imageId);
				imageUploads.push({
					upload,
					promise: upload.promise().catch((err) => {
						if (error) return;

						error = err;
						abort();
					})
				});
				imageMetas.push(
					(async () => {
						try {
							let hash = '';
							const { width, height } = await image.metadata();

							if (width && height) {
								const maxDim = Math.max(width, height);
								const minComponentCount = Math.round(
									Math.min(width, height) /
										Math.floor(maxDim / 5)
								);

								if (minComponentCount) {
									const resizedImage = image.resize(
										maxDim === width
											? { width: 100 }
											: { height: 100 }
									);

									let resizedWidth: number;
									let resizedHeight: number;

									if (maxDim === width) {
										resizedWidth = 100;
										resizedHeight = Math.round(
											(100 / width) * height
										);
									} else {
										resizedWidth = Math.round(
											(100 / height) * width
										);
										resizedHeight = 100;
									}

									const componentX =
										maxDim === width
											? 5
											: minComponentCount;
									const componentY =
										maxDim === width
											? minComponentCount
											: 5;

									hash = encode(
										Uint8ClampedArray.from(
											await image
												.ensureAlpha()
												.toFormat('raw')
												.toBuffer()
										),
										resizedWidth,
										resizedHeight,
										componentX,
										componentY
									);
								}
							}

							return {
								width: width || 0,
								height: height || 0,
								hash
							};
						} catch (err) {
							if (error) return;

							error = err;
							abort();
						}
					})()
				);
			});

			await new Promise((resolve) =>
				req.pipe(req.busboy).once('finish', () => resolve())
			);

			const results = await Promise.all([
				Promise.all(imageUploads.map((upload) => upload.promise)),
				Promise.all(imageMetas)
			]);

			if (error) throw error;

			try {
				await mgr.update(
					PostItem,
					{ where: { id: post.id } },
					{ imageCount: post.imageCount + imageIds.length }
				);

				const images = await Promise.all(
					imageIds.map((imageId, index) => {
						const postImage = new PostItemImage();
						postImage.uuid = imageId;
						postImage.index = post.imageCount + index;
						postImage.width = (<ImageMeta[]>results[1])[
							index
						].width;
						postImage.height = (<ImageMeta[]>results[1])[
							index
						].height;
						postImage.hash = (<ImageMeta[]>results[1])[index].hash;
						postImage.url = (<S3.ManagedUpload.SendData[]>(
							results[0]
						))[index].Location;
						postImage.post = post;

						return mgr.save(postImage);
					})
				);

				return images.map((image) => image.index);
			} catch (err) {
				abort();
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
				select: ['id', 'uuid']
			});

			if (!post) throw new NotFoundException('post not exists');

			const image = await mgr.findOne(PostItemImage, {
				where: { post, index: parseInt(index) },
				select: ['id', 'uuid']
			});

			if (!image) throw new NotFoundException('image not exists');

			try {
				await this.s3
					.deleteObjects({
						Bucket: process.env.AWS_S3_BUCKET_NAME!,
						Delete: {
							Objects: [
								{
									Key: `${post.uuid}/${image.uuid}`
								}
							]
						}
					})
					.promise();
			} catch {}

			await mgr.remove(image);
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
				.where('PostItem.slug = :slug', { slug })
				.select([
					'PostItem.id',
					'PostItem.uuid',
					'PostItemImage.id',
					'PostItemImage.uuid'
				])
				.getOne();

			if (!post) throw new NotFoundException('no post found');

			for (let index = 0; index < post.images.length; index += 1000)
				try {
					await this.s3
						.deleteObjects({
							Bucket: process.env.AWS_S3_BUCKET_NAME!,
							Delete: {
								Objects: post.images
									.slice(index, index + 1000)
									.map((image) => {
										return {
											Key: `${post.uuid}/${image.uuid}`
										};
									})
							}
						})
						.promise();
				} catch {}

			mgr.remove(post.images);
			mgr.remove(post);
		});
	}
}
