import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['reflect-metadata'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  clearMocks: true,
};

export default config;
