const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: [ ...( baseConfig.setupFilesAfterEnv || [] ), '<rootDir>/jest.setup.ts' ],
	moduleNameMapper: {
		...( baseConfig.moduleNameMapper || {} ),
		'\\.(css|scss)$': '<rootDir>/__mocks__/styleMock.js',
	},
	transform: {
		...( baseConfig.transform || {} ),
		'^.+\\.(ts|tsx)$': 'babel-jest',
	},
};
