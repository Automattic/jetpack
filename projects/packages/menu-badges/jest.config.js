const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	rootDir: __dirname,
	testMatch: [ '**/tests/js/**/*.test.js' ],
};
