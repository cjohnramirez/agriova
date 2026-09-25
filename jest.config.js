// Date tests assert Philippine calendar behaviour, and CI runners default to
// UTC. Workers inherit this, so it must be set before Jest spawns them.
process.env.TZ = 'Asia/Manila';

const moduleNameMapper = { '^@/(.*)$': '<rootDir>/src/$1' };

module.exports = {
  projects: [
    {
      // Pure logic and the SQLite schema. Node, not React Native, so the real
      // migration can run against node:sqlite.
      displayName: 'logic',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/**/*.test.ts'],
      moduleNameMapper,
    },
    {
      displayName: 'ui',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/src/**/*.test.tsx', '<rootDir>/app/**/*.test.tsx'],
      moduleNameMapper,
    },
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}'],
};
