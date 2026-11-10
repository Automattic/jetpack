const path = require( 'path' );
const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );
const coverageConfig = require( 'jetpack-js-tools/jest/config.coverage.js' );

module.exports = {
	...baseConfig,
	...coverageConfig,
	rootDir: path.join( __dirname, '..' ),
	moduleNameMapper: {
		...baseConfig.moduleNameMapper,
		// The shell's modules import each other by their import-map IDs.
		'^@automattic/jetpack-admin-shell/(.*)$': '<rootDir>/src/admin-shell/$1.js',
	},
};
