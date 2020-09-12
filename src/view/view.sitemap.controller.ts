import { Controller } from '@nestjs/common';
import { Get } from '@nestjs/common';
import { ParseIntPipe } from '@nestjs/common';
import { Param, Res } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { IsNull, Not } from 'typeorm';

import { DBConnService } from '../db/db.conn.service';

import { PostItem, PostItemAccessLevel } from '../db/entity/PostItem';

@Controller()
export class ViewSitemapController {
	constructor(private conn: DBConnService) {}

	@Get('sitemaps')
	async generateSitemapIndex(@Res() res: Response): Promise<void> {
		res.set('Content-Type', 'text/xml');
		return this.conn.conn.transaction(async (mgr) => {
			const count = await mgr.count(PostItem, {
				where: {
					accessLevel: PostItemAccessLevel.PUBLIC,
					content: Not(IsNull()),
				},
			});

			const queries = [];

			for (let index = 0; index < count; index += 50000)
				queries.push(
					mgr
						.createQueryBuilder(PostItem, 'PostItem')
						.where('PostItem.accessLevel = :accessLevel', {
							accessLevel: PostItemAccessLevel.PUBLIC,
						})
						.select(['PostItem.modifiedAt'])
						.orderBy('PostItem.modifiedAt')
						.offset(index)
						.getOne()
				);

			res.send(
				`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${(
					await Promise.all(queries)
				)
					.map((postItem, index) =>
						postItem
							? `<sitemap><loc>${
									process.env.SITEMAP_BASE_URL
							  }sitemaps/${index}</loc><lastmod>${postItem.modifiedAt.toISOString()}</lastmod></sitemap>`
							: ''
					)
					.join('')}</sitemapindex>`
			);
		});
	}

	@Get('sitemaps/:page')
	async generateSitemap(
		@Param('page', ParseIntPipe) page: number,
		@Res() res: Response
	): Promise<void> {
		if (page < 0)
			throw new BadRequestException(
				'page must be greater than or equal to zero'
			);

		res.set('Content-Type', 'text/xml').send(
			`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${(
				await this.conn.conn.manager.find(PostItem, {
					where: {
						accessLevel: PostItemAccessLevel.PUBLIC,
						content: Not(IsNull()),
					},
					select: ['slug', 'modifiedAt'],
					order: { modifiedAt: 'ASC' },
					skip: page * 50000,
				})
			)
				.map((postItem) =>
					postItem
						? `<url><loc>${process.env.POST_BASE_URL}${
								postItem.slug
						  }</loc><lastmod>${postItem.modifiedAt.toISOString()}</lastmod></url>`
						: ''
				)
				.join('')}</urlset>`
		);
	}
}
