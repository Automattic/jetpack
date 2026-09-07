const path = require( 'path' );
const boostConfig = require( '../../tests/jest.config.cjs' );

module.exports = {
	...boostConfig,
	testMatch: [ '<rootDir>/_inc/overview/**/*.test.{ts,tsx}' ],
	testEnvironmentOptions: { customExportConditions: [ 'browser', 'jetpack:src' ] },
	setupFilesAfterEnv: [ require.resolve( 'jetpack-js-tools/jest/setup-jest-dom.js' ) ],
	moduleDirectories: [ 'node_modules', '<rootDir>/routes/dashboard/node_modules' ],
	moduleNameMapper: {
		...boostConfig.moduleNameMapper,
		'^@automattic/charts$': path.resolve(
			__dirname,
			'../../../../js-packages/charts/src/index.ts'
		),
		'^@automattic/charts/style.css$': path.resolve(
			__dirname,
			'../../../../js-packages/charts/src/style.css'
		),
	},
	transformIgnorePatterns: [
		'/node_modules/(?!.*/node_modules/)(?!d3-|internmap/|uuid/|@wordpress/theme/)',
	],
};
