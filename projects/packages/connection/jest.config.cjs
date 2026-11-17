const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	// tests/js holds node:test files, run by `node --test`.
	testPathIgnorePatterns: [ ...baseConfig.testPathIgnorePatterns, '<rootDir>/tests/js/' ],
};
