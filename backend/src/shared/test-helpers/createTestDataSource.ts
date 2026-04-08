import 'reflect-metadata';
import { newDb, DataType } from 'pg-mem';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { setAppDataSource } from '../database/data-source';
import { Company } from '../../modules/companies/companies.entity';
import { User } from '../../modules/users/users.entity';
import { MagicLink } from '../../modules/magiclinks/magiclinks.entity';
import { Report } from '../../modules/reports/reports.entity';
import { ReportStatusHistory } from '../../modules/reports/report-status-history.entity';

const ALL_ENTITIES = [Company, User, MagicLink, Report, ReportStatusHistory];

export async function createTestDataSource(): Promise<DataSource> {
  const db = newDb({ autoCreateForeignKeyIndices: true });

  // TypeORM ≥0.3.20 calls `SELECT version()` on connect; pg-mem doesn't
  // implement it, so we register a stub to keep the connection setup happy.
  db.public.registerFunction({
    name: 'version',
    returns: DataType.text,
    implementation: () => 'PostgreSQL 16.0 (pg-mem)',
  });

  // TypeORM also calls current_database() and current_schema() during connect.
  db.public.registerFunction({
    name: 'current_database',
    returns: DataType.text,
    implementation: () => 'test',
  });

  db.public.registerFunction({
    name: 'current_schema',
    returns: DataType.text,
    implementation: () => 'public',
  });

  // TypeORM uses uuid_generate_v4() as the DEFAULT for UUID columns in older
  // versions, and gen_random_uuid() in newer versions (≥0.3.20).
  // pg-mem's built-in gen_random_uuid() is deterministic/sequential and can
  // produce duplicate UUIDs that collide with explicitly-seeded test data, so
  // we override both functions with a truly-random implementation.
  db.public.registerFunction({
    name: 'uuid_generate_v4',
    returns: DataType.uuid,
    impure: true,
    implementation: () => uuidv4(),
  });

  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.uuid,
    impure: true,
    implementation: () => uuidv4(),
  });

  const ds: DataSource = await db.adapters.createTypeormDataSource({
    type: 'postgres',
    entities: ALL_ENTITIES,
    synchronize: true,
    migrations: [],
  });

  await ds.initialize();

  setAppDataSource(ds);

  return ds;
}
