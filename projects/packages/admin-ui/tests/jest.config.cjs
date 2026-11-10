const path = require( 'path' );
const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );
const coverageConfig = require( 'jetpack-js-tools/jest/config.coverage.js' );

module.exports = {
	...baseConfig,
	...coverageConfig,
	rootDir: path.join( __dirname, '..' ),
};
