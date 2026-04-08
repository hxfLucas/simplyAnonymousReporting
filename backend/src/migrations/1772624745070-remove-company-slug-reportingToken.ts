import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveCompanySlugReportingToken1772624745070 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN IF EXISTS "slug"`);
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN IF EXISTS "reporting_token"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'companies',
      new TableColumn({ name: 'slug', type: 'varchar', isNullable: false, isUnique: true })
    );

    await queryRunner.addColumn(
      'companies',
      new TableColumn({ name: 'reporting_token', type: 'varchar', isNullable: false, isUnique: true })
    );
  }
}
