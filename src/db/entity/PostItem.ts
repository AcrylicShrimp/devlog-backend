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

@Entity()
export class PostItem {
	@PrimaryGeneratedColumn()
	id!: number;

	@ManyToOne(() => Category)
	category!: Category;

	@Column({ length: 128, unique: true, nullable: false })
	title!: string;

	@Column({ length: 128, nullable: true })
	contentPreview!: string;

	@Column({ type: 'mediumtext', nullable: true })
	content!: string;

	@OneToMany(() => PostItemImage, (image) => image.post)
	images!: PostItemImage[];

	@Column()
	isPrivate!: boolean;

	@CreateDateColumn()
	createdAt!: Date;

	@UpdateDateColumn()
	modifiedAt!: Date;
}
