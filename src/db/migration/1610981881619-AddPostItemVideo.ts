import {MigrationInterface, QueryRunner} from "typeorm";

export class AddPostItemVideo1610981881619 implements MigrationInterface {
    name = 'AddPostItemVideo1610981881619'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_694c4e22fa9b2c93a15adf3116` ON `post_item`");
        await queryRunner.query("CREATE TABLE `post_item_video` (`id` int NOT NULL AUTO_INCREMENT, `uuid` varchar(64) NOT NULL, `index` int NOT NULL, `url` varchar(256) NOT NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `modifiedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `postId` int NULL, INDEX `IDX_57345763f3f97ae01712855392` (`index`), UNIQUE INDEX `IDX_dd2e1b5158f145524d6cec3db4` (`url`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `post_item` ADD `videoCount` int NOT NULL DEFAULT '0'");
        await queryRunner.query("ALTER TABLE `category` CHANGE `modifiedAt` `modifiedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)");
        await queryRunner.query("ALTER TABLE `post_item_image` CHANGE `modifiedAt` `modifiedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)");
        await queryRunner.query("ALTER TABLE `post_item_thumbnail` CHANGE `modifiedAt` `modifiedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)");
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `modifiedAt` `modifiedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)");
        await queryRunner.query("ALTER TABLE `post_item_video` ADD CONSTRAINT `FK_9f7f46718b9b5f3b63c99a9f910` FOREIGN KEY (`postId`) REFERENCES `post_item`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `post_item` ADD CONSTRAINT `FK_694c4e22fa9b2c93a15adf3116f` FOREIGN KEY (`thumbnailId`) REFERENCES `post_item_thumbnail`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `post_item` DROP FOREIGN KEY `FK_694c4e22fa9b2c93a15adf3116f`");
        await queryRunner.query("ALTER TABLE `post_item_video` DROP FOREIGN KEY `FK_9f7f46718b9b5f3b63c99a9f910`");
        await queryRunner.query("ALTER TABLE `post_item` CHANGE `modifiedAt` `modifiedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)");
        await queryRunner.query("ALTER TABLE `post_item_thumbnail` CHANGE `modifiedAt` `modifiedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)");
        await queryRunner.query("ALTER TABLE `post_item_image` CHANGE `modifiedAt` `modifiedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)");
        await queryRunner.query("ALTER TABLE `category` CHANGE `modifiedAt` `modifiedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)");
        await queryRunner.query("ALTER TABLE `post_item` DROP COLUMN `videoCount`");
        await queryRunner.query("DROP INDEX `IDX_dd2e1b5158f145524d6cec3db4` ON `post_item_video`");
        await queryRunner.query("DROP INDEX `IDX_57345763f3f97ae01712855392` ON `post_item_video`");
        await queryRunner.query("DROP TABLE `post_item_video`");
        await queryRunner.query("CREATE UNIQUE INDEX `IDX_694c4e22fa9b2c93a15adf3116` ON `post_item` (`thumbnailId`)");
    }

}
