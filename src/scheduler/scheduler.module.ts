import { Module } from '@nestjs/common';
import {
	ElasticsearchModule,
	ElasticsearchService,
} from '@nestjs/elasticsearch';
import { parse, Renderer } from 'marked';

import { DBConnService } from '../db/db.conn.service';

import { PostItem } from '../db/entity/PostItem';

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
									title: { type: 'text', analyzer: 'nori' },
									content: { type: 'text', analyzer: 'nori' },
									createdAt: { type: 'date' },
								},
							},
						},
					});

				setInterval(this.syncWithES.bind(this), 1000 * 5);
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

			const textRenderer = new (class extends Renderer {
				code() {
					return '';
				}

				blockquote(quote: string) {
					return `${quote}\n`;
				}

				html() {
					return '';
				}

				heading(text: string) {
					return `${text}\n`;
				}

				hr() {
					return '';
				}

				list(body: string) {
					return `${body}\n`;
				}

				listitem(text: string) {
					return `${text}\n`;
				}

				checkbox() {
					return '';
				}

				paragraph(text: string) {
					return `${text}\n`;
				}

				table(header: string, body: string) {
					return `${header}\n${body}\n`;
				}

				tablerow(content: string) {
					return `${content}\n`;
				}

				tablecell(content: string) {
					return `${content}\n`;
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
					return '';
				}

				del(text: string) {
					return text;
				}

				link(href: string | null, title: string | null, text: string) {
					return `${href} ${title} ${text} `;
				}

				image() {
					return '';
				}

				text(text: string) {
					return text;
				}
			})();

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

				const post = await this.conn.conn.manager.findOne(
					PostItem,
					posts[index].id,
					{
						select: [
							'accessLevel',
							'category',
							'title',
							'content',
							'createdAt',
						],
					}
				);

				if (!post) continue;

				const textContent = await new Promise<string>(
					(resolve, reject) =>
						parse(
							post.content!,
							{
								renderer: textRenderer,
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

				console.log(
					await this.es.create({
						id: posts[index].slug,
						index: 'devlog-posts',
						body: {
							accessLevel: post.accessLevel,
							category: post.category || '',
							title: post.title,
							content: textContent,
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
