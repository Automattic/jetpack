const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	setupFilesAfterEnv: [ ...baseConfig.setupFilesAfterEnv, '<rootDir>/jest.setup.js' ],
};
