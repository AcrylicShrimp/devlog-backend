import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn
} from 'typeorm';

@Entity()
export class AdminUser {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ length: 128, unique: true, nullable: false })
	email!: string;

	@Column({ length: 64, unique: true, nullable: false })
	username!: string;

	@Column({ length: 60, nullable: false })
	pw!: string;

	@CreateDateColumn()
	joinedAt!: Date;
}
