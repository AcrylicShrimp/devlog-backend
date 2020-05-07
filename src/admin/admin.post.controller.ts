import { Controller, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { Get, Post, Delete } from '@nestjs/common';
import { Param } from '@nestjs/common';
import { BadRequestException, ConflictException } from '@nestjs/common';
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
