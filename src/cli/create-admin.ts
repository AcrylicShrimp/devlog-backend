import { hash } from 'bcrypt';
import { createHash } from 'crypto';
import { createInterface } from 'readline';
import { Writable } from 'stream';
import { createConnection, QueryFailedError } from 'typeorm';
import validator from 'validator';

import { Admin } from '../db/entity/Admin';

let muted = false;

const readline = createInterface({
	terminal: true,
	input: process.stdin,
	output: new Writable({
		write: (chunk, encoding, cb) => {
			if (!muted) process.stdout.write(chunk, encoding);
			cb();
		}
	})
});
const question = (query: string): Promise<string> => {
	muted = false;

	return new Promise<string>((resolve, _) =>
		readline.question(query, resolve)
	);
};
const questionHide = (query: string): Promise<string> => {
	muted = false;

	return new Promise<string>((resolve, _) => {
		readline.question(query, (answer) => {
			console.log();
			resolve(answer);
		});
		muted = true;
	});
};

(async () => {
	let email;
	let username;
	let pw;

	for (;;) {
		for (;;) {
			email = await question('email: ');

			if (
				!email ||
				!(email = validator.trim(email)) ||
				!validator.isEmail(email)
			)
				continue;

			break;
		}

		for (;;) {
			const usernameFromEmail = validator.trim(email.split('@')[0]);
			username = await question(`username [${usernameFromEmail}]:`);

			if (!username || !(username = validator.trim(username)))
				username = usernameFromEmail;

			if (!username) continue;

			break;
		}

		for (;;) {
			pw = await questionHide('password:');

			if (!pw || !validator.isLength(pw, { min: 6 })) continue;

			const pwConfirm = await questionHide('password confirm:');

			if (pw !== pwConfirm) continue;

			break;
		}

		console.log(`email: ${email}`);
		console.log(`username: ${username}`);

		const answer = validator.trim(await question('is it ok? [Yn]:'));

		if (!answer || answer === 'y' || answer === 'Y') break;
	}

	const connection = await createConnection();

	const admin = new Admin();
	admin.email = email;
	admin.username = username;
	admin.pw = await createHash('sha256')
		.update(await hash(pw, 10))
		.digest('base64');

	try {
		await connection.manager.save(admin);
		console.log('admin created.');
	} catch (err) {
		if (err instanceof QueryFailedError)
			console.log('email or username already exists.');
		else throw err;
	} finally {
		connection.close();
		readline.close();
	}
})();
