const path = require( 'path' );

module.exports = {
	rootDir: path.resolve( __dirname, '..' ),
	roots: [ '<rootDir>/tests/' ],
	collectCoverageFrom: [ '<rootDir>/src/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}' ],
	resolver: require.resolve( 'jetpack-js-tools/jest/jest-resolver.js' ),
};
