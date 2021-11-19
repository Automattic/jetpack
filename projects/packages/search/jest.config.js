/**
 * External dependencies
 */
const path = require( 'path' );

module.exports = {
	testMatch: [ '<rootDir>/**/test/*.[jt]s?(x)', '!**/.eslintrc.*' ],
	// TODO: Enable once instant search has been migrated.
	// roots: [ '<rootDir>/src/instant-search' ],
	transform: {
		'\\.[jt]sx?$': path.join(
			__dirname,
			'../../plugins/jetpack/tests/jest-extensions-babel-transform'
		),
		'\\.(gif|jpg|jpeg|png|svg|scss|sass|css)$': path.join(
			__dirname,
			'../../plugins/jetpack/tests/jest-extensions-asset-stub'
		),
	},
	moduleNameMapper: {
		'tiny-lru/lib/tiny-lru.esm$': '<rootDir>/src/instant-search/lib/test-helpers/tiny-lru.mock.js',
	},
};
