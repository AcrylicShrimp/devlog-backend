import {MigrationInterface, QueryRunner} from "typeorm";

export class AddIndex1589112988974 implements MigrationInterface {
    name = 'AddIndex1589112988974'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `admin_session` DROP FOREIGN KEY `FK_b41305caf8ef2f3847957746a2f`", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` CHANGE `userId` `userId` int NULL", undefined);
        await queryRunner.query("ALTER TABLE `category` CHANGE `description` `description` varchar(256) NULL", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` DROP FOREIGN KEY `FK_a0e437b6ad0b098a1f22357c815`", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` CHANGE `postId` `postId` int NULL", undefined);
        await queryRunner.query("ALTER TABLE `post_item` DROP FOREIGN KEY `FK_583829a77a7b675981de33ecae2`", undefined);
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `content` `content` mediumtext NULL", undefined);
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `contentPreview` `contentPreview` varchar(256) NULL", undefined);
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `htmlContent` `htmlContent` mediumtext NULL", undefined);
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `categoryId` `categoryId` int NULL", undefined);
        await queryRunner.query("CREATE INDEX `IDX_83503cf78b784a6a4b5da68edd` ON `post_item_image` (`index`)", undefined);
        await queryRunner.query("CREATE INDEX `IDX_88ff1ff42c4bbaa10018e72c37` ON `post_item` (`createdAt`)", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` ADD CONSTRAINT `FK_b41305caf8ef2f3847957746a2f` FOREIGN KEY (`userId`) REFERENCES `admin`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` ADD CONSTRAINT `FK_a0e437b6ad0b098a1f22357c815` FOREIGN KEY (`postId`) REFERENCES `post_item`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `post_item` ADD CONSTRAINT `FK_583829a77a7b675981de33ecae2` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `post_item` DROP FOREIGN KEY `FK_583829a77a7b675981de33ecae2`", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` DROP FOREIGN KEY `FK_a0e437b6ad0b098a1f22357c815`", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` DROP FOREIGN KEY `FK_b41305caf8ef2f3847957746a2f`", undefined);
        await queryRunner.query("DROP INDEX `IDX_88ff1ff42c4bbaa10018e72c37` ON `post_item`", undefined);
        await queryRunner.query("DROP INDEX `IDX_83503cf78b784a6a4b5da68edd` ON `post_item_image`", undefined);
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `categoryId` `categoryId` int NULL DEFAULT 'NULL'", undefined);
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `htmlContent` `htmlContent` mediumtext NULL DEFAULT 'NULL'", undefined);
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `contentPreview` `contentPreview` varchar(256) NULL DEFAULT 'NULL'", undefined);
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `content` `content` mediumtext NULL DEFAULT 'NULL'", undefined);
        await queryRunner.query("ALTER TABLE `post_item` ADD CONSTRAINT `FK_583829a77a7b675981de33ecae2` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` CHANGE `postId` `postId` int NULL DEFAULT 'NULL'", undefined);
        await queryRunner.query("ALTER TABLE `post_item_image` ADD CONSTRAINT `FK_a0e437b6ad0b098a1f22357c815` FOREIGN KEY (`postId`) REFERENCES `post_item`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `category` CHANGE `description` `description` varchar(256) NULL DEFAULT 'NULL'", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` CHANGE `userId` `userId` int NULL DEFAULT 'NULL'", undefined);
        await queryRunner.query("ALTER TABLE `admin_session` ADD CONSTRAINT `FK_b41305caf8ef2f3847957746a2f` FOREIGN KEY (`userId`) REFERENCES `admin`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
    }

}
