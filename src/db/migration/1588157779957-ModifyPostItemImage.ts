import {MigrationInterface, QueryRunner} from "typeorm";

export class ModifyPostItemImage1588157779957 implements MigrationInterface {
    name = 'ModifyPostItemImage1588157779957'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `admin_session` DROP FOREIGN KEY `FK_b41305caf8ef2f3847957746a2f`", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` CHANGE `userId` `userId` int NULL", undefined);
        await queryRunner.query("ALTER TABLE `category` CHANGE `description` `description` varchar(256) NULL", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` DROP FOREIGN KEY `FK_a0e437b6ad0b098a1f22357c815`", undefined);
        await queryRunner.query("DROP INDEX `IDX_f0254bd23b71055a6664bf7196` ON `post_item_image`", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` DROP COLUMN `url`", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` ADD `url` varchar(256) NOT NULL", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` ADD UNIQUE INDEX `IDX_f0254bd23b71055a6664bf7196` (`url`)", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` CHANGE `postId` `postId` int NULL", undefined);
        await queryRunner.query("ALTER TABLE `post_item` DROP FOREIGN KEY `FK_583829a77a7b675981de33ecae2`", undefined);
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `contentPreview` `contentPreview` varchar(128) NULL", undefined);
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `content` `content` mediumtext NULL", undefined);
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
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `content` `content` mediumtext NULL DEFAULT 'NULL'", undefined);
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `contentPreview` `contentPreview` varchar(128) NULL DEFAULT 'NULL'", undefined);
        await queryRunner.query("ALTER TABLE `post_item` ADD CONSTRAINT `FK_583829a77a7b675981de33ecae2` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` CHANGE `postId` `postId` int NULL DEFAULT 'NULL'", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` DROP INDEX `IDX_f0254bd23b71055a6664bf7196`", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` DROP COLUMN `url`", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` ADD `url` varchar(128) NOT NULL", undefined);
        await queryRunner.query("CREATE UNIQUE INDEX `IDX_f0254bd23b71055a6664bf7196` ON `post_item_image` (`url`)", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` ADD CONSTRAINT `FK_a0e437b6ad0b098a1f22357c815` FOREIGN KEY (`postId`) REFERENCES `post_item`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `category` CHANGE `description` `description` varchar(256) NULL DEFAULT 'NULL'", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` CHANGE `userId` `userId` int NULL DEFAULT 'NULL'", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` ADD CONSTRAINT `FK_b41305caf8ef2f3847957746a2f` FOREIGN KEY (`userId`) REFERENCES `admin`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
    }

}