/**
 * External dependencies
 */
const path = require( 'path' );

module.exports = {
	testMatch: [ '<rootDir>/**/test/*.test.[jt]s?(x)', '!**/.eslintrc.*' ],
	roots: [ '<rootDir>/src' ],
	transform: {
		'\\.[jt]sx?$': path.join( __dirname, 'tests/jest-extensions-babel-transform' ),
		'\\.(gif|jpg|jpeg|png|svg|scss|sass|css|ttf|woff|woff2)$': path.join(
			__dirname,
			'tests/jest-extensions-asset-stub'
		),
	},
	moduleNameMapper: {
		'tiny-lru/lib/tiny-lru.esm$': '<rootDir>/src/instant-search/lib/test-helpers/tiny-lru.mock.js',
		jetpackConfig: '<rootDir>/tests/jest-jetpack-config.js',
	},
	moduleDirectories: [ 'node_modules', '<rootDir>/src/dashboard' ],
};
