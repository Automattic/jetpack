const boostConfig = require( '../../tests/jest.base.config.cjs' );

module.exports = {
	...boostConfig,
	roots: [ __dirname ],
	testMatch: [ '<rootDir>/_inc/overview/**/*.test.{ts,tsx}' ],
	setupFilesAfterEnv: [ require.resolve( 'jetpack-js-tools/jest/setup-jest-dom.js' ) ],
	// Jest ORs ignore patterns, so extend each pattern's exceptions in place.
	transformIgnorePatterns: boostConfig.transformIgnorePatterns.map( pattern =>
		pattern.replace( '/node_modules/', '/node_modules/(?!d3-|internmap/)' )
	),
};
