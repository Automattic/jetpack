/**
 * External dependencies
 */
const path = require( 'path' );

module.exports = {
	testEnvironment: 'jsdom',
	testMatch: [ '<rootDir>/**/test/*.[jt]s?(x)', '!**/.eslintrc.*' ],
	roots: [ '<rootDir>/extensions/' ],
	transform: {
		'\\.[jt]sx?$': path.join( __dirname, 'tests', 'jest-extensions-babel-transform' ),
		'\\.(gif|jpg|jpeg|png|svg|scss|sass|css|ttf|woff|woff2)$': require.resolve(
			'jetpack-js-tools/jest/jest-extensions-asset-stub.js'
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
	// Work around some packages that only provide module versions in jest's jsdom environment.
	// https://github.com/microsoft/accessibility-insights-web/pull/5421#issuecomment-1109168149
	resolver: require.resolve( 'jetpack-js-tools/jest/jest-resolver.js' ),
};
