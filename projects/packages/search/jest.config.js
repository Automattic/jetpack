/**
 * External dependencies
 */
const path = require( 'path' );

module.exports = {
	testEnvironment: 'jsdom',
	testMatch: [ '<rootDir>/**/test/*.test.[jt]s?(x)', '!**/.eslintrc.*' ],
	roots: [ '<rootDir>/src' ],
	transform: {
		'\\.[jt]sx?$': path.join( __dirname, 'tests', 'jest-extensions-babel-transform' ),
		'.+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
	},
	// coverageDirectory: 'coverage/extensions',
	setupFiles: [ '<rootDir>/tests/jest-globals.js' ],
	setupFilesAfterEnv: [ '<rootDir>/tests/jest-enzyme-init.js', require.resolve( 'jest-enzyme' ) ],
	snapshotSerializers: [ 'enzyme-to-json/serializer' ],
	testPathIgnorePatterns: [ 'node_modules' ],
	moduleNameMapper: {
		'\\.(css|less)$': '<rootDir>/test/jest/__mocks__/styleMock.js',
	},
	moduleDirectories: [ 'node_modules', '<rootDir>/src/dashboard' ],
};
