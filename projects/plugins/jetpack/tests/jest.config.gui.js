const baseConfig = require( './jest.config.base.js' );

module.exports = {
	...baseConfig,
	roots: [ '<rootDir>/_inc/client/' ],
	testMatch: [ '<rootDir>/_inc/client/test/main.js', '<rootDir>/_inc/client/**/test/component.js' ],
	setupFiles: [ ...baseConfig.setupFiles, '<rootDir>/tests/jest-globals.gui.js' ],
	setupFilesAfterEnv: [
		...baseConfig.setupFilesAfterEnv,
		'<rootDir>/tests/jest-enzyme-init.js',
		require.resolve( 'jest-enzyme' ),
	],
	snapshotSerializers: [ 'enzyme-to-json/serializer' ],
	transformIgnorePatterns: [ '/node_modules/(?!(.pnpm|@automattic)/)' ],
	coverageDirectory: 'coverage/gui',
};
