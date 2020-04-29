import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { randomBytes, createHash } from 'crypto';

const TOKEN_BYTE = 128;
const TOKEN_SHORT_BYTE = 32;
const HASH_ROUND = 10;

@Injectable()
export class AuthTokenService {
	generate(): Promise<string> {
		return new Promise((resolve, reject) =>
			randomBytes(TOKEN_BYTE, (err, buf) =>
				err ? reject(err) : resolve(buf.toString('hex'))
			)
		);
	}
	generateShort(): Promise<string> {
		return new Promise((resolve, reject) =>
			randomBytes(TOKEN_SHORT_BYTE, (err, buf) =>
				err ? reject(err) : resolve(buf.toString('hex'))
			)
		);
	}
	hashPW(pw: string): Promise<string> {
		return hash(
			createHash('sha256').update(pw).digest('base64'),
			HASH_ROUND
		);
	}
	comparePW(pw: string, hash: string): Promise<boolean> {
		return compare(createHash('sha256').update(pw).digest('base64'), hash);
	}
}
