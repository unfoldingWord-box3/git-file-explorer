module.exports = {
  'roots': [
    '<rootDir>/src',
  ],
  // 'transform': { '^.+\\.ts?$': 'ts-jest' },
  'moduleFileExtensions': [
    'js',
    'ts',
  ],
  'coveragePathIgnorePatterns': [
    '/node_modules/',
  ],
  'testPathIgnorePatterns': [
    '/node_modules/',
  ],
  'collectCoverageFrom': [
    'src/**/*.{js,jsx,ts}',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/components/**',
  ],
  'coverageDirectory': './coverage/',
};