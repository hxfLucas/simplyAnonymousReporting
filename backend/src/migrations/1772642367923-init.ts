import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1772642367923 implements MigrationInterface {
    name = 'Init1772642367923'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "report_status_history" DROP CONSTRAINT "FK_f6d35b6fc303f55b6af6fce3d52"`);
        await queryRunner.query(`ALTER TABLE "report_status_history" DROP CONSTRAINT "FK_1dbe91a83984a3ae5afc3341d83"`);
        await queryRunner.query(`ALTER TABLE "report_status_history" ADD CONSTRAINT "FK_f6d35b6fc303f55b6af6fce3d52" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "report_status_history" ADD CONSTRAINT "FK_1dbe91a83984a3ae5afc3341d83" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "report_status_history" DROP CONSTRAINT "FK_1dbe91a83984a3ae5afc3341d83"`);
        await queryRunner.query(`ALTER TABLE "report_status_history" DROP CONSTRAINT "FK_f6d35b6fc303f55b6af6fce3d52"`);
        await queryRunner.query(`ALTER TABLE "report_status_history" ADD CONSTRAINT "FK_1dbe91a83984a3ae5afc3341d83" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "report_status_history" ADD CONSTRAINT "FK_f6d35b6fc303f55b6af6fce3d52" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
