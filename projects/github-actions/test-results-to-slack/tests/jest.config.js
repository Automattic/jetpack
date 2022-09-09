const path = require( 'path' );

module.exports = {
	rootDir: path.resolve( __dirname, '..' ),
	roots: [ '<rootDir>/tests/' ],
	collectCoverageFrom: [ '<rootDir>/src/**/*.js' ],
	resolver: require.resolve( 'jetpack-js-tools/jest/jest-resolver.js' ),
	clearMocks: true,
};
