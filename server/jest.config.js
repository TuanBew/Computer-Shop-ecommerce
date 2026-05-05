module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/uploads/**'],
  coverageDirectory: '../coverage/server',
  coverageReporters: ['text', 'html'],
  testTimeout: 30000,
};
