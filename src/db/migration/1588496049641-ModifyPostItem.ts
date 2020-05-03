import {MigrationInterface, QueryRunner} from "typeorm";

export class ModifyPostItem1588496049641 implements MigrationInterface {
    name = 'ModifyPostItem1588496049641'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `isPrivate` `accessLevel` tinyint NOT NULL", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` DROP FOREIGN KEY `FK_b41305caf8ef2f3847957746a2f`", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` CHANGE `userId` `userId` int NULL", undefined);
        await queryRunner.query("ALTER TABLE `category` CHANGE `description` `description` varchar(256) NULL", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` DROP FOREIGN KEY `FK_a0e437b6ad0b098a1f22357c815`", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` CHANGE `postId` `postId` int NULL", undefined);
        await queryRunner.query("ALTER TABLE `post_item` DROP FOREIGN KEY `FK_583829a77a7b675981de33ecae2`", undefined);
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `contentPreview` `contentPreview` varchar(256) NULL", undefined);
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `content` `content` mediumtext NULL", undefined);
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `htmlContent` `htmlContent` mediumtext NULL", undefined);
        await queryRunner.query("ALTER TABLE `post_item` DROP COLUMN `accessLevel`", undefined);
        await queryRunner.query("ALTER TABLE `post_item` ADD `accessLevel` enum ('public', 'unlisted', 'private') NOT NULL", undefined);
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `categoryId` `categoryId` int NULL", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` ADD CONSTRAINT `FK_b41305caf8ef2f3847957746a2f` FOREIGN KEY (`userId`) REFERENCES `admin`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` ADD CONSTRAINT `FK_a0e437b6ad0b098a1f22357c815` FOREIGN KEY (`postId`) REFERENCES `post_item`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `post_item` ADD CONSTRAINT `FK_583829a77a7b675981de33ecae2` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `post_item` DROP FOREIGN KEY `FK_583829a77a7b675981de33ecae2`", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` DROP FOREIGN KEY `FK_a0e437b6ad0b098a1f22357c815`", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` DROP FOREIGN KEY `FK_b41305caf8ef2f3847957746a2f`", undefined);
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `categoryId` `categoryId` int NULL DEFAULT 'NULL'", undefined);
        await queryRunner.query("ALTER TABLE `post_item` DROP COLUMN `accessLevel`", undefined);
        await queryRunner.query("ALTER TABLE `post_item` ADD `accessLevel` tinyint NOT NULL", undefined);
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `htmlContent` `htmlContent` mediumtext NULL DEFAULT 'NULL'", undefined);
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `content` `content` mediumtext NULL DEFAULT 'NULL'", undefined);
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `contentPreview` `contentPreview` varchar(256) NULL DEFAULT 'NULL'", undefined);
        await queryRunner.query("ALTER TABLE `post_item` ADD CONSTRAINT `FK_583829a77a7b675981de33ecae2` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` CHANGE `postId` `postId` int NULL DEFAULT 'NULL'", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` ADD CONSTRAINT `FK_a0e437b6ad0b098a1f22357c815` FOREIGN KEY (`postId`) REFERENCES `post_item`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `category` CHANGE `description` `description` varchar(256) NULL DEFAULT 'NULL'", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` CHANGE `userId` `userId` int NULL DEFAULT 'NULL'", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` ADD CONSTRAINT `FK_b41305caf8ef2f3847957746a2f` FOREIGN KEY (`userId`) REFERENCES `admin`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `accessLevel` `isPrivate` tinyint NOT NULL", undefined);
    }

}
