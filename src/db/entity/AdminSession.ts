import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	OneToOne,
	JoinColumn,
} from 'typeorm';

import { Admin } from './Admin';

@Entity()
export class AdminSession {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ length: 256, unique: true, nullable: false })
	token!: string;

	@OneToOne(() => Admin)
	@JoinColumn()
	user!: Admin;

	@Column({ nullable: false })
	usedAt!: Date;

	@CreateDateColumn()
	createdAt!: Date;
}
