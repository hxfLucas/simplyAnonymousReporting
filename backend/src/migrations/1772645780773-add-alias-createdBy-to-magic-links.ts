import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAliasCreatedByToMagicLinks1772645780773 implements MigrationInterface {
    name = 'AddAliasCreatedByToMagicLinks1772645780773'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "magic_links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reportingToken" character varying NOT NULL, "company_id" uuid NOT NULL, "alias" character varying, "created_by_id" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0b0aef9891fc75864ca8967b26c" UNIQUE ("reportingToken"), CONSTRAINT "PK_6c609d48037f164e7ae5b744b18" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "magic_links" ADD CONSTRAINT "FK_5f76322fef0b85c1a6fcdaa4286" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "magic_links" ADD CONSTRAINT "FK_eec71bce30c2e93063b0ba12adc" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "magic_links" DROP CONSTRAINT "FK_eec71bce30c2e93063b0ba12adc"`);
        await queryRunner.query(`ALTER TABLE "magic_links" DROP CONSTRAINT "FK_5f76322fef0b85c1a6fcdaa4286"`);
        await queryRunner.query(`DROP TABLE "magic_links"`);
    }

}
