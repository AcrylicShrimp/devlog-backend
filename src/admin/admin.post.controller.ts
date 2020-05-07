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
