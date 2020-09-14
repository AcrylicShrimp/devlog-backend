import { Module } from '@nestjs/common';
import {
	ElasticsearchModule,
	ElasticsearchService,
} from '@nestjs/elasticsearch';

@Module({
	imports: [
		ElasticsearchModule.register({
			node: `http://${process.env.ELASTICSEARCH_NODE_HOST}:${process.env.ELASTICSEARCH_NODE_PORT}`,
		}),
	],
})
export class ESModule {
	constructor(es: ElasticsearchService) {
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
			} catch (err) {
				console.error(
					`[scheduler] - [INIT] :: An error occurred: ${err}`
				);
			}
		})();
	}
}
