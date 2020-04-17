import {MigrationInterface, QueryRunner} from "typeorm";

export class DefineAdminSession1587122559394 implements MigrationInterface {
    name = 'DefineAdminSession1587122559394'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `admin_session` (`id` int NOT NULL AUTO_INCREMENT, `token` varchar(256) NOT NULL, `usedAt` datetime NOT NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `userId` int NULL, UNIQUE INDEX `IDX_37285554a9e7350eac7867e8ee` (`token`), UNIQUE INDEX `REL_b41305caf8ef2f3847957746a2` (`userId`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` ADD CONSTRAINT `FK_b41305caf8ef2f3847957746a2f` FOREIGN KEY (`userId`) REFERENCES `admin`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `admin_session` DROP FOREIGN KEY `FK_b41305caf8ef2f3847957746a2f`", undefined);
        await queryRunner.query("DROP INDEX `REL_b41305caf8ef2f3847957746a2` ON `admin_session`", undefined);
        await queryRunner.query("DROP INDEX `IDX_37285554a9e7350eac7867e8ee` ON `admin_session`", undefined);
        await queryRunner.query("DROP TABLE `admin_session`", undefined);
    }

}
