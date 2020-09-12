import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

import { ViewPostController } from './view.post.controller';
import { ViewCategoryController } from './view.category.controller';
import { ViewSitemapController } from './view.sitemap.controller';

@Module({
	imports: [
		ElasticsearchModule.register({
			node: `http://${process.env.ELASTICSEARCH_NODE_HOST}:${process.env.ELASTICSEARCH_NODE_PORT}`,
		}),
	],
	controllers: [
		ViewCategoryController,
		ViewPostController,
		ViewSitemapController,
	],
})
export class ViewModule {}
