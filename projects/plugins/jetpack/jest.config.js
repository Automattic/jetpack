/**
 * External dependencies
 */
const path = require( 'path' );

module.exports = {
	preset: '@automattic/calypso-build',
	testEnvironment: 'jsdom',
	roots: [ '<rootDir>/extensions/', '<rootDir>/modules/search/instant-search' ],
	transform: {
		'\\.[jt]sx?$': path.join( __dirname, 'tests', 'jest-extensions-babel-transform' ),
		'\\.(gif|jpg|jpeg|png|svg|scss|sass|css)$': require.resolve(
			'@automattic/calypso-build/jest/transform/asset'
		),
	},
	coverageDirectory: 'coverage/extensions',
	setupFiles: [ '<rootDir>/tests/jest-globals.js' ],
	testPathIgnorePatterns: [ 'node_modules', 'extensions/shared/test/block-fixtures.js' ],
};
