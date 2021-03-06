import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	OneToMany,
	Index,
	OneToOne,
	JoinColumn,
} from 'typeorm';

import { Category } from './Category';
import { PostItemImage } from './PostItemImage';
import { PostItemThumbnail } from './PostItemThumbnail';
import { PostItemVideo } from './PostItemVideo';

export enum PostItemAccessLevel {
	PUBLIC = 'public',
	UNLISTED = 'unlisted',
	PRIVATE = 'private',
}

@Entity()
export class PostItem {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ length: 64, unique: true })
	uuid!: string;

	@Column({ length: 256, unique: true })
	slug!: string;

	@Column({ type: 'enum', enum: PostItemAccessLevel })
	accessLevel!: PostItemAccessLevel;

	@ManyToOne(() => Category)
	category?: Category;

	@Column({ length: 128, nullable: false })
	title!: string;

	@Column({ type: 'mediumtext', nullable: true })
	content?: string;

	@Column({ length: 256, nullable: true })
	contentPreview?: string;

	@Column({ type: 'mediumtext', nullable: true })
	htmlContent?: string;

	@OneToMany(() => PostItemImage, (image) => image.post)
	images!: PostItemImage[];

	@Column({ default: 0 })
	imageCount!: number; // Accumulates total uploaded image count.

	@OneToMany(() => PostItemVideo, (video) => video.post)
	videos!: PostItemVideo[];

	@Column({ default: 0 })
	videoCount!: number; // Accumulates total uploaded video count.

	@OneToOne(() => PostItemThumbnail)
	@JoinColumn()
	thumbnail!: PostItemThumbnail;

	@CreateDateColumn()
	@Index()
	createdAt!: Date;

	@UpdateDateColumn()
	@Index()
	modifiedAt!: Date;
}
