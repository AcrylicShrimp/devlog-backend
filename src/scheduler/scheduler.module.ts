import { Module } from '@nestjs/common';
import {
	ElasticsearchModule,
	ElasticsearchService,
} from '@nestjs/elasticsearch';

import { DBConnService } from '../db/db.conn.service';

import { PostItem } from '../db/entity/PostItem';
import { parseAsText } from '../helper/MDRenderer';

@Module({
	imports: [
		ElasticsearchModule.register({
			node: `http://${process.env.ELASTICSEARCH_NODE_HOST}:${process.env.ELASTICSEARCH_NODE_PORT}`,
		}),
	],
})
export class SchedulerModule {
	constructor(private es: ElasticsearchService, private conn: DBConnService) {
		(async () => {
			try {
				if (!(await es.indices.exists({ index: 'devlog-posts' })).body)
					await es.indices.create({
						index: 'devlog-posts',
						body: {
							mappings: {
								properties: {
									accessLevel: { type: 'keyword' },
									category: { type: 'keyword' },
									title: {
										type: 'text',
										fields: {
											unicode: {
												type: 'text',
												analyzer: 'icu_analyzer',
											},
											english: {
												type: 'text',
												analyzer: 'english',
											},
											korean: {
												type: 'text',
												analyzer: 'nori',
											},
											japanese: {
												type: 'text',
												analyzer: 'kuromoji',
											},
											chinese: {
												type: 'text',
												analyzer: 'smartcn',
											},
										},
									},
									content: {
										type: 'text',
										fields: {
											unicode: {
												type: 'text',
												analyzer: 'icu_analyzer',
											},
											english: {
												type: 'text',
												analyzer: 'english',
											},
											korean: {
												type: 'text',
												analyzer: 'nori',
											},
											japanese: {
												type: 'text',
												analyzer: 'kuromoji',
											},
											chinese: {
												type: 'text',
												analyzer: 'smartcn',
											},
										},
									},
									createdAt: { type: 'date' },
								},
							},
						},
					});

				setInterval(this.syncWithES.bind(this), 1000 * 60);
			} catch (err) {
				console.error(
					`[scheduler] - [INIT] :: An error occurred: ${err}`
				);
			}
		})();
	}

	private async syncWithES() {
		try {
			const posts = await this.conn.conn.manager
				.createQueryBuilder(PostItem, 'PostItem')
				.where('PostItem.content IS NOT NULL')
				.select(['PostItem.id', 'PostItem.slug'])
				.orderBy('PostItem.createdAt', 'DESC')
				.getMany();

			console.log(posts);

			for (let index = 0; index < posts.length; ++index) {
				if (
					(
						await this.es.exists({
							id: posts[index].slug,
							index: 'devlog-posts',
						})
					).body
				)
					break;

				const post = await this.conn.conn.manager
					.createQueryBuilder(PostItem, 'PostItem')
					.where('PostItem.id = :id', { id: posts[index].id })
					.andWhere('PostItem.content IS NOT NULL')
					.leftJoin('PostItem.category', 'Category')
					.select([
						'PostItem.accessLevel',
						'PostItem.title',
						'PostItem.content',
						'PostItem.createdAt',
						'Category.name',
					])
					.orderBy('PostItem.createdAt', 'DESC')
					.getOne();

				if (!post) continue;

				console.log(
					await this.es.create({
						id: posts[index].slug,
						index: 'devlog-posts',
						body: {
							accessLevel: post.accessLevel,
							category: post.category?.name || '',
							title: post.title,
							content: await parseAsText(post.content!),
							createdAt: post.createdAt,
						},
					})
				);
			}
		} catch (err) {
			console.error(
				`[scheduler] - [syncWithES] :: An error occurred: ${err}`
			);
		}
	}
}
