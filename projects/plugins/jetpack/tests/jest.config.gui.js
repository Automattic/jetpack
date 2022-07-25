const baseConfig = require( './jest.config.base.js' );

module.exports = {
	...baseConfig,
	roots: [ '<rootDir>/_inc/client/' ],
	testMatch: [ '<rootDir>/_inc/client/test/main.js', '<rootDir>/_inc/client/**/test/component.js' ],
	setupFilesAfterEnv: [ ...baseConfig.setupFilesAfterEnv, '<rootDir>/tests/jest-globals.gui.js' ],
	transformIgnorePatterns: [ '/node_modules/(?!(.pnpm|@automattic)/)' ],
	coverageDirectory: 'coverage/gui',
};
