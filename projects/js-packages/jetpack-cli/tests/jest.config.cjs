const path = require( 'path' );
const baseConfig = require( '@automattic/jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	rootDir: path.join( __dirname, '..' ),
};
