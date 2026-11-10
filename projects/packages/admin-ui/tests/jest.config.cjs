const path = require( 'path' );
const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );
const coverageConfig = require( 'jetpack-js-tools/jest/config.coverage.js' );

module.exports = {
	...baseConfig,
	...coverageConfig,
	rootDir: path.join( __dirname, '..' ),
	// The shared-modules parser ships as ESM inside the patched @wordpress/build.
	transformIgnorePatterns: [ '/node_modules/(?!(\\.pnpm/[^/]+/node_modules/)?@wordpress/build/)' ],
};
