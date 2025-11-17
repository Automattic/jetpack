const path = require( 'path' );
const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	rootDir: path.join( __dirname, '..' ),
	setupFilesAfterEnv: [ ...baseConfig.setupFilesAfterEnv, '<rootDir>/tests/jest.setup.js' ],

	// Hack so the ESM-only `@wordpress/interactivity` can be used with Jest in CommonJS mode.
	// @todo Run Jest in ESM mode so this isn't needed.
	transformIgnorePatterns: [ '/node_modules/(?!.pnpm/|@wordpress/interactivity/)' ],
	resolver: require.resolve( './jest-resolver.js' ),
};
