import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1772641324716 implements MigrationInterface {
    name = 'Init1772641324716'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "is_anonymous"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "reporter_email"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" ADD "reporter_email" character varying`);
        await queryRunner.query(`ALTER TABLE "reports" ADD "is_anonymous" boolean NOT NULL`);
    }

}
