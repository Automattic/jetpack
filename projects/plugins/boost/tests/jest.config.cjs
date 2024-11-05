const path = require( 'path' );
// eslint-disable-next-line import/no-extraneous-dependencies -- This is ok here.
const coverageConfig = require( 'jetpack-js-tools/jest/config.coverage.js' );

module.exports = {
	rootDir: path.join( __dirname, '..' ),
	testEnvironment: 'jsdom',
	collectCoverageFrom: [
		'<rootDir>/app/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		...coverageConfig.collectCoverageFrom,
	],
};
