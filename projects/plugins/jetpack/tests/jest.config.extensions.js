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
	moduleNameMapper: {
		...baseConfig.moduleNameMapper,
		'\\.(css|less|sass|scss)$': '<rootDir>/tests/styles-mock.js',
	},
	collectCoverageFrom: [
		'<rootDir>/extensions/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		...baseConfig.collectCoverageFrom.slice( 3 ),
	],
};
