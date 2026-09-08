const path = require( 'path' );
const boostConfig = require( '../../tests/jest.base.config.cjs' );

module.exports = {
	...boostConfig,
	roots: [ __dirname ],
	testPathIgnorePatterns: [ '/node_modules/' ],
	testMatch: [ '<rootDir>/_inc/overview/**/*.test.{ts,tsx}' ],
	testEnvironmentOptions: { customExportConditions: [ 'browser', 'jetpack:src' ] },
	setupFilesAfterEnv: [ require.resolve( 'jetpack-js-tools/jest/setup-jest-dom.js' ) ],
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
	// Jest ORs ignore patterns, so extend each pattern's exceptions in place.
	transformIgnorePatterns: boostConfig.transformIgnorePatterns.map( pattern =>
		pattern.replace( '/node_modules/', '/node_modules/(?!d3-|internmap/)' )
	),
};
