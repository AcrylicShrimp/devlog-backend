import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	UpdateDateColumn,
	Index,
} from 'typeorm';

import { PostItem } from './PostItem';

@Entity()
export class PostItemImage {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ length: 64 })
	uuid!: string;

	@Column({ nullable: false })
	@Index()
	index!: number;

	@Column({ nullable: false })
	width!: number;

	@Column({ nullable: false })
	height!: number;

	@Column({ length: 64, nullable: false })
	hash!: string; // Blurhash string used for front-end side.

	@Column({ length: 256, unique: true, nullable: false })
	url!: string;

	@ManyToOne(() => PostItem, (post) => post.images)
	post!: PostItem;

	@CreateDateColumn()
	createdAt!: Date;

	@UpdateDateColumn()
	modifiedAt!: Date;
}
