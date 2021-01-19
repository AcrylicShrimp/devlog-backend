import { Injectable } from '@nestjs/common';

import { PostItem } from '../db/entity/PostItem';

import {
	parseAsPlain,
	parseAsHTMLWithImageAndVideo,
	parseAsText,
} from '../helper/MDRenderer';

@Injectable()
export class AdminPostService {
	private readonly urlRegex = /^https?:(?:\/\/)?(?:\w[\w-]+\w|\w{1,2})(?:\.(?:\w[\w-]+\w|\w{1,2}))*\//;

	async generatePostContent(
		post: PostItem,
		content: string
	): Promise<{
		contentText: string;
		contentPreview: string;
		htmlContent: string;
	}> {
		const postImage: { [key: number]: string } = {};
		const postVideo: { [key: number]: string } = {};

		for (const image of post.images)
			postImage[image.index] = process.env.CDN_BASE_URL
				? image.url.replace(this.urlRegex, process.env.CDN_BASE_URL)
				: image.url;

		for (const video of post.videos) postVideo[video.index] = video.url;

		// Slice some beginning content and cutout a broken HTML entity if any.
		const contentPreview = (await parseAsPlain(content))
			.slice(0, 256)
			.replace(/\s*&[^\s;]*$/, '');

		return {
			contentText: await parseAsText(content),
			contentPreview,
			htmlContent: await parseAsHTMLWithImageAndVideo(
				content,
				postImage,
				postVideo
			),
		};
	}
}
