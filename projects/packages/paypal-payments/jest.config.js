const path = require( 'path' );
const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	rootDir: path.resolve( __dirname ),
	roots: [ '<rootDir>/tests/js' ],
	transform: {
		...baseConfig.transform,
		'\\.[jt]sx?$': require( 'jetpack-js-tools/jest/babel-jest-config-factory.js' )(
			require.resolve
		),
	},
	moduleNameMapper: {
		...baseConfig.moduleNameMapper,
		'\\.(css|less|sass|scss)$': '<rootDir>/tests/styles-mock.js',
		'^../src/block/block\\.json$': '<rootDir>/tests/json-mock.js',
	},
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: [ '<rootDir>/tests/jest.setup.js', '@testing-library/jest-dom' ],
	collectCoverageFrom: [
		'<rootDir>/src/**/*.{js,jsx,ts,tsx}',
		'!<rootDir>/src/**/*.test.{js,jsx,ts,tsx}',
		'!<rootDir>/src/**/*.stories.{js,jsx,ts,tsx}',
		'!<rootDir>/src/**/index.{js,jsx,ts,tsx}',
	],
	coverageDirectory: '<rootDir>/coverage',
	testMatch: [ '<rootDir>/tests/js/**/*.test.[jt]s?(x)' ],
};
