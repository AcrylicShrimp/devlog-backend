import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm';

@Entity()
export class PostItemThumbnail {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ nullable: false })
	width!: number;

	@Column({ nullable: false })
	height!: number;

	@Column({ length: 64, nullable: false })
	hash!: string; // Blurhash string used for front-end side.

	@Column({ length: 256, unique: true, nullable: false })
	url!: string;

	@CreateDateColumn()
	createdAt!: Date;

	@UpdateDateColumn()
	modifiedAt!: Date;
}
