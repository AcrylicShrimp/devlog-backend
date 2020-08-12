import dotenv from 'dotenv';

import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

import { AdminModule } from './admin/admin.module';
import { DBModule } from './db/db.module';
import { ViewModule } from './view/view.module';

dotenv.config();

@Module({
	imports: [
		AdminModule,
		DBModule,
		ViewModule,
		ElasticsearchModule.register({
			node: `http://${process.env.ELASTICSEARCH_NODE_HOST}:${process.env.ELASTICSEARCH_NODE_PORT}`,
		}),
	],
})
export class AppModule {}
