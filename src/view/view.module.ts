import { Module } from '@nestjs/common';

import { ViewPostController } from './view.post.controller';
import { ViewCategoryController } from './view.category.controller';

@Module({
	controllers: [ViewCategoryController, ViewPostController]
})
export class ViewModule {}
