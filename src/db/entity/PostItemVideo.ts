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
export class PostItemVideo {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ length: 64 })
	uuid!: string;

	@Column({ nullable: false })
	@Index()
	index!: number;

	@Column({ length: 256, unique: true, nullable: false })
	url!: string;

	@ManyToOne(() => PostItem, (post) => post.images)
	post!: PostItem;

	@CreateDateColumn()
	createdAt!: Date;

	@UpdateDateColumn()
	modifiedAt!: Date;
}
