/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    rootDir: '.',
    testMatch: ['<rootDir>/tests/**/*.test.ts'],
    setupFiles: ['<rootDir>/tests/jest.setup.ts'],
    transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
    },
    // Integration tests share one real Postgres database (see tests/README.md) —
    // running them serially avoids races between tests that touch overlapping
    // rows. --runInBand in package.json's test script does the same at the
    // process level; this is the in-process fallback if that's ever dropped.
    maxWorkers: 1,
    testTimeout: 15000,
};
