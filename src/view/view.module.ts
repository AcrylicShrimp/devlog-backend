import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

import { ViewPostController } from './view.post.controller';
import { ViewCategoryController } from './view.category.controller';
import { ViewSitemapController } from './view.sitemap.controller';
import { ViewSSRCacheService } from './view.ssr.cache.service';
import { ViewSSRController } from './view.ssr.controller';
import { ViewSSRFetchService } from './view.ssr.fetch.service';

const cache = new ViewSSRCacheService();

@Module({
	imports: [
		ElasticsearchModule.register({
			node: `http://${process.env.ELASTICSEARCH_NODE_HOST}:${process.env.ELASTICSEARCH_NODE_PORT}`,
		}),
	],
	providers: [
		{
			provide: ViewSSRCacheService,
			useValue: cache,
		},
		{
			provide: ViewSSRFetchService,
			useFactory: () =>
				new ViewSSRFetchService((...args) =>
					import('node-fetch').then((module) =>
						module.default(...args)
					)
				),
		},
	],
	exports: [ViewSSRCacheService],
	controllers: [
		ViewCategoryController,
		ViewPostController,
		ViewSitemapController,
		ViewSSRController,
	],
})
export class ViewModule {}
