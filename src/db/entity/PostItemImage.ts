import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne
} from 'typeorm';

import { PostItem } from './PostItem';

@Entity()
export class PostItemImage {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	width!: number;

	@Column()
	height!: number;

	@Column('text')
	hash!: string; // Blurhash string used for front-end side.

	@Column('text')
	url!: string;

	@ManyToOne(() => PostItem, (post) => post.images)
	post!: PostItem;

	@CreateDateColumn()
	createdAt!: Date;
}
