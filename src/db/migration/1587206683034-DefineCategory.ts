import {MigrationInterface, QueryRunner} from "typeorm";

export class DefineCategory1587206683034 implements MigrationInterface {
    name = 'DefineCategory1587206683034'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `category` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(32) NOT NULL, `description` varchar(256) NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `modifiedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `post` (`id` int NOT NULL AUTO_INCREMENT, `title` varchar(128) NOT NULL, `content` mediumtext NOT NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `modifiedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `categoryId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` DROP FOREIGN KEY `FK_b41305caf8ef2f3847957746a2f`", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` CHANGE `userId` `userId` int NULL", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` ADD CONSTRAINT `FK_b41305caf8ef2f3847957746a2f` FOREIGN KEY (`userId`) REFERENCES `admin`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `post` ADD CONSTRAINT `FK_1077d47e0112cad3c16bbcea6cd` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `post` DROP FOREIGN KEY `FK_1077d47e0112cad3c16bbcea6cd`", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` DROP FOREIGN KEY `FK_b41305caf8ef2f3847957746a2f`", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` CHANGE `userId` `userId` int NULL DEFAULT 'NULL'", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` ADD CONSTRAINT `FK_b41305caf8ef2f3847957746a2f` FOREIGN KEY (`userId`) REFERENCES `admin`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("DROP TABLE `post`", undefined);
        await queryRunner.query("DROP TABLE `category`", undefined);
    }

}
