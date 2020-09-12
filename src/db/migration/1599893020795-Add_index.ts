import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndex1599893020795 implements MigrationInterface {
	name = 'AddIndex1599893020795';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			'CREATE INDEX `IDX_e9efcd8787e8d89ab0f0150d66` ON `post_item` (`modifiedAt`)'
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			'DROP INDEX `IDX_e9efcd8787e8d89ab0f0150d66` ON `post_item`'
		);
	}
}
