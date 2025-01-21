const baseConfig = require( '@automattic/jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	roots: [ '<rootDir>/src' ],
	setupFilesAfterEnv: [ ...baseConfig.setupFilesAfterEnv, '<rootDir>/jest.setup.js' ],
};
