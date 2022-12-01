const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	roots: [ '<rootDir>/src' ],
	moduleDirectories: [ 'node_modules', '<rootDir>/src' ],
	setupFilesAfterEnv: [ ...baseConfig.setupFilesAfterEnv, '<rootDir>/jest.setup.js' ],
};
