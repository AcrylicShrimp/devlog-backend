import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

import { AuthModule } from '../auth/auth.module';

import { AdminSessionController } from './admin.session.controller';
import { AdminCategoryController } from './admin.category.controller';
import { AdminPostController } from './admin.post.controller';
import { AdminPostService } from './admin.post.service';

@Module({
	imports: [
		AuthModule,
		ElasticsearchModule.register({
			node: `http://${process.env.ELASTICSEARCH_NODE_HOST}:${process.env.ELASTICSEARCH_NODE_PORT}`,
		}),
	],
	providers: [AdminPostService],
	controllers: [
		AdminSessionController,
		AdminCategoryController,
		AdminPostController,
	],
})
export class AdminModule {}
