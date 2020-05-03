import {MigrationInterface, QueryRunner} from "typeorm";

export class DefineModel1588498909719 implements MigrationInterface {
    name = 'DefineModel1588498909719'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `admin` (`id` int NOT NULL AUTO_INCREMENT, `email` varchar(128) NOT NULL, `username` varchar(64) NOT NULL, `pw` varchar(60) NOT NULL, `joinedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_de87485f6489f5d0995f584195` (`email`), UNIQUE INDEX `IDX_5e568e001f9d1b91f67815c580` (`username`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `admin_session` (`id` int NOT NULL AUTO_INCREMENT, `token` varchar(256) NOT NULL, `usedAt` datetime NOT NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `userId` int NULL, UNIQUE INDEX `IDX_37285554a9e7350eac7867e8ee` (`token`), UNIQUE INDEX `REL_b41305caf8ef2f3847957746a2` (`userId`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `category` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(32) NOT NULL, `description` varchar(256) NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `modifiedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_23c05c292c439d77b0de816b50` (`name`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `post_item_image` (`id` int NOT NULL AUTO_INCREMENT, `index` int NOT NULL, `width` int NOT NULL, `height` int NOT NULL, `hash` varchar(64) NOT NULL, `url` varchar(256) NOT NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `modifiedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `postId` int NULL, UNIQUE INDEX `IDX_f0254bd23b71055a6664bf7196` (`url`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `post_item` (`id` int NOT NULL AUTO_INCREMENT, `uuid` varchar(64) NOT NULL, `slug` varchar(256) NOT NULL, `title` varchar(128) NOT NULL, `contentPreview` varchar(256) NULL, `content` mediumtext NULL, `htmlContent` mediumtext NULL, `accessLevel` enum ('public', 'unlisted', 'private') NOT NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `modifiedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `categoryId` int NULL, UNIQUE INDEX `IDX_4617c669790536b49d2f94b9e5` (`uuid`), UNIQUE INDEX `IDX_28a6575de287826830858e25fd` (`slug`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` ADD CONSTRAINT `FK_b41305caf8ef2f3847957746a2f` FOREIGN KEY (`userId`) REFERENCES `admin`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` ADD CONSTRAINT `FK_a0e437b6ad0b098a1f22357c815` FOREIGN KEY (`postId`) REFERENCES `post_item`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `post_item` ADD CONSTRAINT `FK_583829a77a7b675981de33ecae2` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `post_item` DROP FOREIGN KEY `FK_583829a77a7b675981de33ecae2`", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` DROP FOREIGN KEY `FK_a0e437b6ad0b098a1f22357c815`", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` DROP FOREIGN KEY `FK_b41305caf8ef2f3847957746a2f`", undefined);
        await queryRunner.query("DROP INDEX `IDX_28a6575de287826830858e25fd` ON `post_item`", undefined);
        await queryRunner.query("DROP INDEX `IDX_4617c669790536b49d2f94b9e5` ON `post_item`", undefined);
        await queryRunner.query("DROP TABLE `post_item`", undefined);
        await queryRunner.query("DROP INDEX `IDX_f0254bd23b71055a6664bf7196` ON `post_item_image`", undefined);
        await queryRunner.query("DROP TABLE `post_item_image`", undefined);
        await queryRunner.query("DROP INDEX `IDX_23c05c292c439d77b0de816b50` ON `category`", undefined);
        await queryRunner.query("DROP TABLE `category`", undefined);
        await queryRunner.query("DROP INDEX `REL_b41305caf8ef2f3847957746a2` ON `admin_session`", undefined);
        await queryRunner.query("DROP INDEX `IDX_37285554a9e7350eac7867e8ee` ON `admin_session`", undefined);
        await queryRunner.query("DROP TABLE `admin_session`", undefined);
        await queryRunner.query("DROP INDEX `IDX_5e568e001f9d1b91f67815c580` ON `admin`", undefined);
        await queryRunner.query("DROP INDEX `IDX_de87485f6489f5d0995f584195` ON `admin`", undefined);
        await queryRunner.query("DROP TABLE `admin`", undefined);
    }

}
