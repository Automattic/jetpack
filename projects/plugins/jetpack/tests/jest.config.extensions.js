const path = require( 'path' );
const baseConfig = require( './jest.config.base.js' );

module.exports = {
	...baseConfig,
	roots: [ '<rootDir>/extensions/' ],
	coverageDirectory: 'coverage/extensions',
	setupFiles: [ '<rootDir>/tests/jest-globals.extensions.js' ],
	setupFilesAfterEnv: [
		path.join( __dirname, 'jest-enzyme-init.js' ),
		require.resolve( 'jest-enzyme' ),
	],
	snapshotSerializers: [ 'enzyme-to-json/serializer' ],
	testPathIgnorePatterns: [ 'node_modules', 'extensions/shared/test/block-fixtures.js' ],
};
