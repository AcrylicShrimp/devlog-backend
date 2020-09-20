import {MigrationInterface, QueryRunner} from "typeorm";

export class AddPostItemThumbnail1600590619154 implements MigrationInterface {
    name = 'AddPostItemThumbnail1600590619154'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `post_item_thumbnail` (`id` int NOT NULL AUTO_INCREMENT, `width` int NOT NULL, `height` int NOT NULL, `hash` varchar(64) NOT NULL, `url` varchar(256) NOT NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `modifiedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_80002524b245e56b66264a8e63` (`url`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `post_item` ADD `thumbnailId` int NULL");
        await queryRunner.query("ALTER TABLE `post_item` ADD UNIQUE INDEX `IDX_694c4e22fa9b2c93a15adf3116` (`thumbnailId`)");
        await queryRunner.query("CREATE UNIQUE INDEX `REL_694c4e22fa9b2c93a15adf3116` ON `post_item` (`thumbnailId`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `REL_694c4e22fa9b2c93a15adf3116` ON `post_item`");
        await queryRunner.query("ALTER TABLE `post_item` DROP INDEX `IDX_694c4e22fa9b2c93a15adf3116`");
        await queryRunner.query("ALTER TABLE `post_item` DROP COLUMN `thumbnailId`");
        await queryRunner.query("DROP TABLE `post_item_thumbnail`");
    }

}
