const path = require( 'path' );
const coverageConfig = require( 'jetpack-js-tools/jest/config.coverage.js' );

module.exports = {
	...coverageConfig,
	rootDir: path.resolve( __dirname, '..' ),
	roots: [ '<rootDir>/bin/', '<rootDir>/src/', '<rootDir>/tests/' ],
	resolver: require.resolve( 'jetpack-js-tools/jest/jest-resolver.js' ),
	collectCoverageFrom: [
		'<rootDir>/bin/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		...coverageConfig.collectCoverageFrom,
	],
};
