import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1772624745069 implements MigrationInterface {
    name = 'Init1772624745069'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "report_status_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "report_id" uuid NOT NULL, "old_status" character varying NOT NULL, "new_status" character varying NOT NULL, "changed_by" uuid NOT NULL, "changed_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e9ad2befdc991a63bc35bfe0390" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "is_anonymous" boolean NOT NULL, "reporter_email" character varying, "status" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d9013193989303580053c0b5ef6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "reporting_token" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b28b07d25e4324eee577de5496d" UNIQUE ("slug"), CONSTRAINT "UQ_429a38577f6797247177efc33b3" UNIQUE ("reporting_token"), CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "role" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "report_status_history" ADD CONSTRAINT "FK_f6d35b6fc303f55b6af6fce3d52" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "report_status_history" ADD CONSTRAINT "FK_1dbe91a83984a3ae5afc3341d83" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_c94259fada646a1a0cbe5a1738c" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_7ae6334059289559722437bcc1c" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_7ae6334059289559722437bcc1c"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_c94259fada646a1a0cbe5a1738c"`);
        await queryRunner.query(`ALTER TABLE "report_status_history" DROP CONSTRAINT "FK_1dbe91a83984a3ae5afc3341d83"`);
        await queryRunner.query(`ALTER TABLE "report_status_history" DROP CONSTRAINT "FK_f6d35b6fc303f55b6af6fce3d52"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "companies"`);
        await queryRunner.query(`DROP TABLE "reports"`);
        await queryRunner.query(`DROP TABLE "report_status_history"`);
    }

}
