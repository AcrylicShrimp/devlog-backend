import {MigrationInterface, QueryRunner} from "typeorm";

export class ModifyCategory1587263740600 implements MigrationInterface {
    name = 'ModifyCategory1587263740600'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `admin_session` DROP FOREIGN KEY `FK_b41305caf8ef2f3847957746a2f`", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` CHANGE `userId` `userId` int NULL", undefined);
        await queryRunner.query("ALTER TABLE `category` ADD UNIQUE INDEX `IDX_23c05c292c439d77b0de816b50` (`name`)", undefined);
        await queryRunner.query("ALTER TABLE `category` CHANGE `description` `description` varchar(256) NULL", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` ADD CONSTRAINT `FK_b41305caf8ef2f3847957746a2f` FOREIGN KEY (`userId`) REFERENCES `admin`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `admin_session` DROP FOREIGN KEY `FK_b41305caf8ef2f3847957746a2f`", undefined);
        await queryRunner.query("ALTER TABLE `category` CHANGE `description` `description` varchar(256) NULL DEFAULT 'NULL'", undefined);
        await queryRunner.query("ALTER TABLE `category` DROP INDEX `IDX_23c05c292c439d77b0de816b50`", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` CHANGE `userId` `userId` int NULL DEFAULT 'NULL'", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` ADD CONSTRAINT `FK_b41305caf8ef2f3847957746a2f` FOREIGN KEY (`userId`) REFERENCES `admin`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
    }

}
