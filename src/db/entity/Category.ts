import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Category {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ length: 32, unique: true, nullable: false })
	name!: string;

	@Column({ length: 256, nullable: true })
	description!: string;

	@CreateDateColumn()
	createdAt!: Date;

	@UpdateDateColumn()
	modifiedAt!: Date;
}
