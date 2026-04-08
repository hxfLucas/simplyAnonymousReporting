import 'reflect-metadata';
import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

export const baseDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: false,
  entities: [__dirname + '/../../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/../../migrations/*.{ts,js}']
};

export function createDataSource(overrides?: Partial<DataSourceOptions> | Record<string, any>) {
  // allow loose overrides (from tests) and cast to DataSourceOptions for TypeORM
  const options = ({ ...baseDataSourceOptions, ...(overrides || {}) } as unknown) as DataSourceOptions;
  return new DataSource(options);
}

// internal singleton instance (not exported directly)
let appDataSource: DataSource = createDataSource();
export const AppDataSource = appDataSource;
export function getAppDataSource(): DataSource {
  return appDataSource;
}

export function setAppDataSource(ds: DataSource) {
  appDataSource = ds;
}
