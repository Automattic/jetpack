const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	roots: [ '<rootDir>/src' ],
	setupFilesAfterEnv: [ ...baseConfig.setupFilesAfterEnv, '<rootDir>/tests/jest-globals.gui.js' ],
	moduleNameMapper: {
		...baseConfig.moduleNameMapper,
		'^crm/(.*)': '<rootDir>/src/js/$1',
	}
};
