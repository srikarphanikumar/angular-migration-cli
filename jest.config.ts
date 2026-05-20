import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    // Strip .js extensions so Jest can resolve TypeScript source files
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: './tsconfig.test.json',
      },
    ],
  },
  testMatch: ['**/tests/**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/cli.ts',       // CLI entry is tested via integration, not unit coverage
    '!src/index.ts',     // Re-export barrel, no logic to cover
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
};

export default config;
