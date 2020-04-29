import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	UpdateDateColumn
} from 'typeorm';

import { PostItem } from './PostItem';

@Entity()
export class PostItemImage {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ nullable: false })
	index!: number;

	@Column({ nullable: true })
	width!: number;

	@Column({ nullable: true })
	height!: number;

	@Column({ length: 64, nullable: false })
	hash!: string; // Blurhash string used for front-end side.

	@Column({ length: 128, unique: true, nullable: false })
	url!: string;

	@ManyToOne(() => PostItem, (post) => post.images)
	post!: PostItem;

	@CreateDateColumn()
	createdAt!: Date;

	@UpdateDateColumn()
	modifiedAt!: Date;
}
