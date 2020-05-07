import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	OneToMany
} from 'typeorm';

import { Category } from './Category';
import { PostItemImage } from './PostItemImage';

export enum PostItemAccessLevel {
	PUBLIC = 'public',
	UNLISTED = 'unlisted',
	PRIVATE = 'private'
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
	category!: Category;

	@Column({ length: 128, nullable: false })
	title!: string;

	@Column({ type: 'mediumtext', nullable: true })
	content!: string;

	@Column({ length: 256, nullable: true })
	contentPreview!: string;

	@Column({ type: 'mediumtext', nullable: true })
	htmlContent!: string;

	@OneToMany(() => PostItemImage, (image) => image.post)
	images!: PostItemImage[];

	@Column({ default: 0 })
	imageCount!: number; // Accumulates total uploaded image count.

	@CreateDateColumn()
	createdAt!: Date;

	@UpdateDateColumn()
	modifiedAt!: Date;
}
