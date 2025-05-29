const path = require( 'path' );
const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	rootDir: path.resolve( __dirname ),
	roots: [ '<rootDir>/src' ],
	transform: {
		...baseConfig.transform,
		'\\.[jt]sx?$': require( 'jetpack-js-tools/jest/babel-jest-config-factory.js' )(
			require.resolve
		),
	},
	moduleNameMapper: {
		...baseConfig.moduleNameMapper,
		'\\.(css|less|sass|scss)$': '<rootDir>/src/block/test/styles-mock.js',
	},
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: [ '<rootDir>/src/block/test/jest.setup.js', '@testing-library/jest-dom' ],
	collectCoverageFrom: [
		'<rootDir>/src/**/*.{js,jsx,ts,tsx}',
		'!<rootDir>/src/**/*.test.{js,jsx,ts,tsx}',
		'!<rootDir>/src/**/*.stories.{js,jsx,ts,tsx}',
		'!<rootDir>/src/**/index.{js,jsx,ts,tsx}',
	],
	coverageDirectory: '<rootDir>/coverage',
	testMatch: [
		'<rootDir>/src/**/__tests__/**/*.[jt]s?(x)',
		'<rootDir>/src/**/test/**/*.[jt]s?(x)',
		'<rootDir>/src/**/*.test.[jt]s?(x)',
		'<rootDir>/src/**/*.[jt]s?(x)',
	],
};
