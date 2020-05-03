import { Controller, UseGuards, Req } from '@nestjs/common';
import { Get, Post } from '@nestjs/common';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { encode } from 'blurhash';
import dompurify from 'dompurify';
import { Request } from 'express';
import hljs from 'highlight.js';
import { JSDOM } from 'jsdom';
import { Renderer, parse } from 'marked';
import sharp from 'sharp';
import { PassThrough } from 'stream';
import validator from 'validator';

import { AdminGuard } from './admin.guard';

import { AuthTokenService } from '../auth/auth.token.service';
import { DBConnService } from '../db/db.conn.service';

import { Category } from '../db/entity/Category';
import { PostItem, PostItemAccessLevel } from '../db/entity/PostItem';
import { PostItemImage } from '../db/entity/PostItemImage';

import { asEnum, isEnum } from '../helper/Enum';
import { QueryFailedError } from 'typeorm';

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
				'PostItem.title',
				'PostItem.contentPreview',
				'PostItem.accessLevel',
				'PostItem.createdAt',
				'PostItem.modifiedAt',
				'Category.name'
			])
			.orderBy('PostItem.modifiedAt', 'DESC')
			.limit(20)
			.getMany();
	}

	@Post('admin/posts')
	async newPost(@Req() req: Request): Promise<void> {
		if (!req.busboy)
			throw new BadRequestException('only multipart/formdata allowed');

		const imageBodies: { body: NodeJS.ReadableStream; mime: string }[] = [];

		req.busboy.on('field', (key, value) => (req.body[key] = value));
		req.busboy.on('file', (_, body, filename, encoding, mime) =>
			imageBodies.push({ body: body.pipe(new PassThrough()), mime })
		);

		await new Promise((resolve) =>
			req.pipe(req.busboy).on('finish', () => resolve())
		);

		let slug: string = req.body.slug;
		let title: string = req.body.title;
		let categoryName: string = req.body.category;
		let content: string = req.body.content;
		let accessLevel: string = req.body['access-level'];

		if (!slug || !(slug = slug.trim()))
			throw new BadRequestException('slug required');

		if (!/^[a-z0-9][a-z0-9\-]{3,}[a-z0-9]$/.test(slug))
			throw new BadRequestException('bad slug');

		if (!title || !(title = title.trim()))
			throw new BadRequestException('title required');

		if (!validator.isLength(title, { max: 128 }))
			throw new BadRequestException('title too long');

		if (!categoryName || !(categoryName = categoryName.trim()))
			throw new BadRequestException('category required');

		if (!validator.isLength(categoryName, { max: 32 }))
			throw new BadRequestException('category too long');

		if (!content || !(content = content.trim()))
			throw new BadRequestException('content required');

		if (!accessLevel || !(accessLevel = accessLevel.trim()))
			throw new BadRequestException('access-level required');

		if (!isEnum(PostItemAccessLevel, accessLevel))
			throw new BadRequestException('bad access-level');

		const images = await Promise.all(
			imageBodies.map(async (imageBody) => {
				const image = imageBody.body.pipe(sharp().rotate());
				const metadata = await image.metadata();
				const width = metadata.width;
				const height = metadata.height;
				let hash = '';

				if (width && height) {
					const maxDim = Math.max(width, height);
					const minComponentCount = Math.round(
						Math.min(width, height) / Math.floor(maxDim / 5)
					);

					if (minComponentCount) {
						const componentX =
							maxDim === width ? 5 : minComponentCount;
						const componentY =
							maxDim === width ? minComponentCount : 5;
						hash = encode(
							Uint8ClampedArray.from(
								await image.clone().toFormat('raw').toBuffer()
							),
							width,
							height,
							componentX,
							componentY
						);
					}
				}

				return {
					width,
					height,
					hash,
					body: image.withMetadata().pipe(new PassThrough())
				};
			})
		);

		return this.conn.conn.transaction(async (mgr) => {
			const category = await mgr.findOne(Category, {
				where: { name: categoryName },
				select: ['id']
			});

			if (!category) throw new BadRequestException('category not found');

			const postId = await this.token.generateShort();

			let uploads: S3.ManagedUpload[];
			let uploadResults: S3.ManagedUpload.SendData[];

			try {
				uploads = await Promise.all(
					images.map(
						async (image, index) =>
							new S3.ManagedUpload({
								service: this.s3,
								params: {
									Bucket: process.env.AWS_S3_BUCKET_NAME!,
									Key: `${postId}/${await this.token.generateShort()}`,
									ACL: 'private',
									Body: image.body,
									ContentType: imageBodies[index].mime
								}
							})
					)
				);

				uploadResults = await Promise.all(
					uploads.map((upload) => upload.promise())
				);

				const renderer = new (class extends Renderer {
					image(
						href: string | null,
						title: string | null,
						text: string
					) {
						if (href) {
							const match = href.match(/\$(\d+)$/i);

							if (match) {
								const index = parseInt(match[1]);

								if (
									!isNaN(index) &&
									0 <= index &&
									index < uploadResults.length
								)
									href = uploadResults[index].Location;
							}
						}

						return super.image(href, title, text);
					}
				})();
				const plainRenderer = new (class extends Renderer {
					code() {
						return '';
					}

					blockquote() {
						return '';
					}

					html() {
						return '';
					}

					heading() {
						return '';
					}

					hr() {
						return '';
					}

					list() {
						return '';
					}

					listitem() {
						return '';
					}

					checkbox() {
						return '';
					}

					paragraph(text: string) {
						return `${text} `;
					}

					table() {
						return '';
					}

					tablerow() {
						return '';
					}

					tablecell() {
						return '';
					}

					strong(text: string) {
						return text;
					}

					em(text: string) {
						return text;
					}

					codespan(text: string) {
						return text;
					}

					br() {
						return ' ';
					}

					del() {
						return '';
					}

					link(
						href: string | null,
						title: string | null,
						text: string
					) {
						return text;
					}

					image() {
						return '';
					}

					text(text: string) {
						return text;
					}
				})();

				const htmlContent = await new Promise<string>(
					(resolve, reject) =>
						parse(
							content,
							{
								renderer,
								highlight: (code, lang) =>
									hljs.highlight(
										hljs.getLanguage(lang)
											? lang
											: 'plaintext',
										code
									).value
							},
							(err, parseResult) =>
								err
									? reject(err)
									: resolve(
											dompurify(
												(new JSDOM()
													.window as unknown) as Window
											).sanitize(parseResult.trim())
									  )
						)
				);
				const plainContent = await new Promise<string>(
					(resolve, reject) =>
						parse(
							content,
							{
								renderer: plainRenderer
							},
							(err, parseResult) =>
								err
									? reject(err)
									: resolve(
											parseResult
												.trim()
												.replace(/\s+/g, ' ')
									  )
						)
				);

				// Slice some begining content and cutout a broken HTML entity if any.
				const contentPreview = plainContent
					.slice(0, 256)
					.replace(/\s*&[^\s;]*$/, '');

				const postItem = new PostItem();
				postItem.uuid = postId;
				postItem.slug = slug;
				postItem.category = category;
				postItem.title = title;
				postItem.contentPreview = contentPreview;
				postItem.content = content;
				postItem.htmlContent = htmlContent;
				postItem.accessLevel = asEnum(PostItemAccessLevel, accessLevel);

				await mgr.save(postItem);
				await Promise.all(
					uploadResults.map(async (uploadResult, index) => {
						const postItemImage = new PostItemImage();
						postItemImage.index = index;
						postItemImage.width = images[index].width || 0;
						postItemImage.height = images[index].height || 0;
						postItemImage.hash = images[index].hash || '';
						postItemImage.url = uploadResult.Location;
						postItemImage.post = postItem;

						return mgr.save(postItemImage);
					})
				);
			} catch (err) {
				uploads!.forEach((upload) => upload.abort());

				for (
					let index = 0;
					index < uploadResults!.length;
					index += 1000
				) {
					try {
						await this.s3
							.deleteObjects({
								Bucket: process.env.AWS_S3_BUCKET_NAME!,
								Delete: {
									Objects: uploadResults!
										.slice(index, index + 1000)
										.map((uploadResult) => {
											return { Key: uploadResult.Key };
										})
								}
							})
							.promise();
					} catch {}
				}

				if (err instanceof QueryFailedError)
					throw new ConflictException('slug already taken');

				throw err;
			}
		});
	}
}
