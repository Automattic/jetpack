const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	testPathIgnorePatterns: [ ...baseConfig.testPathIgnorePatterns, '/build/' ],
};
