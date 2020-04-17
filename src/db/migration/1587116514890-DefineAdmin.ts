import {MigrationInterface, QueryRunner} from "typeorm";

export class DefineAdmin1587116514890 implements MigrationInterface {
    name = 'DefineAdmin1587116514890'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `admin` (`id` int NOT NULL AUTO_INCREMENT, `email` varchar(128) NOT NULL, `username` varchar(64) NOT NULL, `pw` varchar(60) NOT NULL, `joinedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_de87485f6489f5d0995f584195` (`email`), UNIQUE INDEX `IDX_5e568e001f9d1b91f67815c580` (`username`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_5e568e001f9d1b91f67815c580` ON `admin`", undefined);
        await queryRunner.query("DROP INDEX `IDX_de87485f6489f5d0995f584195` ON `admin`", undefined);
        await queryRunner.query("DROP TABLE `admin`", undefined);
    }

}
