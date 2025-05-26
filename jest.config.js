module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node', // Or 'jsdom' if testing browser-specific code
  roots: ['<rootDir>/src'], // Look for tests in the src directory
  testMatch: ['**/*.test.ts'], // Files ending with .test.ts
};
