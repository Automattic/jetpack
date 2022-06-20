const path = require( 'path' );
const baseConfig = require( './jest.config.base.js' );

module.exports = {
	...baseConfig,
	roots: [ '<rootDir>/extensions/' ],
	coverageDirectory: 'coverage/extensions',
	setupFiles: [ ...baseConfig.setupFiles, '<rootDir>/tests/jest-globals.extensions.js' ],
	setupFilesAfterEnv: [
		...baseConfig.setupFilesAfterEnv,
		path.join( __dirname, 'jest-enzyme-init.js' ),
		require.resolve( 'jest-enzyme' ),
	],
	snapshotSerializers: [ 'enzyme-to-json/serializer' ],
	testPathIgnorePatterns: [
		...baseConfig.testPathIgnorePatterns,
		'extensions/shared/test/block-fixtures.js',
	],
};
