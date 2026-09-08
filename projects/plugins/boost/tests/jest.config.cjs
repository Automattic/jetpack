const path = require( 'path' );
const coverageConfig = require( 'jetpack-js-tools/jest/config.coverage.js' );
const config = require( './jest.base.config.cjs' );

module.exports = {
	...coverageConfig,
	rootDir: config.rootDir,
	collectCoverageFrom: config.collectCoverageFrom,
	projects: [ config, path.join( __dirname, '../_inc/overview/jest.config.cjs' ) ],
};
