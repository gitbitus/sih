/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  transform: {
    '^.+\\.tsx?$': ['@swc/jest', {
      jsc: {
        target: 'es2020',
        parser: { syntax: 'typescript', decorators: false },
      },
    }],
    '^.+\\.m?js$': ['@swc/jest', {
      jsc: {
        target: 'es2020',
        parser: { syntax: 'ecmascript' },
      },
    }],
  },
  // Allow transforming ESM packages in node_modules
  transformIgnorePatterns: [
    '/node_modules/(?!(uuid|pdfkit|pino|pino-http|pino-std-serializers|quick-format-unescaped|real-require|sonic-boom|on-exit-leak-free|thread-stream|atomic-sleep)/)',
  ],
  moduleNameMapper: {
    // alias uuid to its CJS build if available
  },
};
