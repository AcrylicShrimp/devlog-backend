import {MigrationInterface, QueryRunner} from "typeorm";

export class DefineAdmin1587112589173 implements MigrationInterface {
    name = 'DefineAdmin1587112589173'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `admin_user` (`id` int NOT NULL AUTO_INCREMENT, `email` varchar(128) NOT NULL, `username` varchar(64) NOT NULL, `pw` varchar(60) NOT NULL, `joinedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_840ac5cd67be99efa5cd989bf9` (`email`), UNIQUE INDEX `IDX_4d0392574f49340bb75a102b04` (`username`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_4d0392574f49340bb75a102b04` ON `admin_user`", undefined);
        await queryRunner.query("DROP INDEX `IDX_840ac5cd67be99efa5cd989bf9` ON `admin_user`", undefined);
        await queryRunner.query("DROP TABLE `admin_user`", undefined);
    }

}
