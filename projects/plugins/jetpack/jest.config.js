/**
 * External dependencies
 */
const path = require( 'path' );

module.exports = {
	testEnvironment: 'jsdom',
	testMatch: [ '<rootDir>/**/test/*.[jt]s?(x)', '!**/.eslintrc.*' ],
	roots: [ '<rootDir>/extensions/', '<rootDir>/modules/search/instant-search' ],
	transform: {
		'\\.[jt]sx?$': path.join( __dirname, 'tests', 'jest-extensions-babel-transform' ),
		'\\.(gif|jpg|jpeg|png|svg|scss|sass|css)$': path.join(
			__dirname,
			'tests/jest-extensions-asset-stub'
		),
	},
	coverageDirectory: 'coverage/extensions',
	setupFiles: [ '<rootDir>/tests/jest-globals.js' ],
	setupFilesAfterEnv: [
		path.join( __dirname, 'tests/jest-enzyme-init.js' ),
		require.resolve( 'jest-enzyme' ),
	],
	snapshotSerializers: [ 'enzyme-to-json/serializer' ],
	testPathIgnorePatterns: [ 'node_modules', 'extensions/shared/test/block-fixtures.js' ],
	moduleNameMapper: {
		'tiny-lru/lib/tiny-lru.esm$':
			'<rootDir>/modules/search/instant-search/lib/test-helpers/tiny-lru.mock.js',
	},
};
