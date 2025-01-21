const path = require( 'path' );
const coverageConfig = require( '@automattic/jetpack-js-tools/jest/config.coverage.js' );

module.exports = {
	...coverageConfig,
	rootDir: path.join( __dirname, '..' ),
};
