const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	roots: [ '<rootDir>/src' ],
	moduleDirectories: [ 'node_modules', '<rootDir>/src' ],
	setupFilesAfterEnv: [ ...baseConfig.setupFilesAfterEnv, '<rootDir>/jest.setup.js' ],
	moduleNameMapper: {
		...baseConfig.moduleNameMapper,
		'\\.(css|less|sass|scss)$': '<rootDir>/tests/styles-mock.js',
	},
};
