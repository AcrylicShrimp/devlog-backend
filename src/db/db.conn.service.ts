import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';

@Injectable()
export class DBConnService {
	public constructor(private connection: Connection) {}

	public get conn() {
		return this.connection;
	}
}
