/**
 * External dependencies
 */
const path = require( 'path' );

module.exports = {
	testMatch: [ '<rootDir>/**/test/*.test.[jt]s?(x)', '!**/.eslintrc.*' ],
	roots: [ '<rootDir>/src' ],
	transform: {
		'\\.[jt]sx?$': path.join( __dirname, 'tests/jest-extensions-babel-transform' ),
		'\\.(gif|jpg|jpeg|png|svg|scss|sass|css|ttf|woff|woff2)$': require.resolve(
			'jetpack-js-tools/jest/jest-extensions-asset-stub.js'
		),
	},
	moduleNameMapper: {
		'tiny-lru/lib/tiny-lru.esm$': '<rootDir>/src/instant-search/lib/test-helpers/tiny-lru.mock.js',
		jetpackConfig: '<rootDir>/tests/jest-jetpack-config.js',
	},
	moduleDirectories: [ 'node_modules', '<rootDir>/src/dashboard' ],
	// Work around some packages that only provide module versions in jest's jsdom environment.
	// https://github.com/microsoft/accessibility-insights-web/pull/5421#issuecomment-1109168149
	resolver: require.resolve( 'jetpack-js-tools/jest/jest-resolver.js' ),
};
