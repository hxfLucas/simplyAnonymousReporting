import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1772632897411 implements MigrationInterface {
    name = 'Init1772632897411'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "magic_link" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reportingToken" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "company_id" uuid, CONSTRAINT "UQ_3c2fb7ad24af0e9deabe0b2b283" UNIQUE ("reportingToken"), CONSTRAINT "PK_4fac5105519c1ac3e645d7f9416" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "magic_link" ADD CONSTRAINT "FK_e084fdbc9d1b2476c77f07ebb5f" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "magic_link" DROP CONSTRAINT "FK_e084fdbc9d1b2476c77f07ebb5f"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`DROP TABLE "magic_link"`);
    }

}
