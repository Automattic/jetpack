const baseConfig = require( './jest.config.base.js' );

module.exports = {
	...baseConfig,
	roots: [ '<rootDir>/extensions/' ],
	coverageDirectory: 'coverage/extensions',
	setupFiles: [ ...baseConfig.setupFiles, '<rootDir>/tests/jest-globals.extensions.js' ],
	testPathIgnorePatterns: [
		...baseConfig.testPathIgnorePatterns,
		'extensions/shared/test/block-fixtures.js',
	],
};
