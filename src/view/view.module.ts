import { Module } from '@nestjs/common';

import { ViewPostController } from './view.post.controller';

@Module({
	controllers: [ViewPostController]
})
export class ViewModule {}
