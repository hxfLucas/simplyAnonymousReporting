import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1772633743538 implements MigrationInterface {
    name = 'Init1772633743538'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_7ae6334059289559722437bcc1c"`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_7ae6334059289559722437bcc1c" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_7ae6334059289559722437bcc1c"`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_7ae6334059289559722437bcc1c" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
