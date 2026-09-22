const path = require( 'path' );
const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

// Set in the process that forks the workers: a worker's V8 has already cached
// its zone by the time a test module runs. Non-UTC is what keeps the restore
// suites' timestamp guards live, and Sao Paulo is GMT-3 with no DST.
process.env.TZ = 'America/Sao_Paulo';

module.exports = {
	...baseConfig,
	rootDir: path.join( __dirname, '..' ),
	setupFilesAfterEnv: [ ...baseConfig.setupFilesAfterEnv, '<rootDir>/tests/jest.setup.js' ],
	// Keep above jest.setup.js's `asyncUtilTimeout`, so a stuck wait fails with Testing
	// Library's missing-element message and DOM dump rather than Jest's bare timeout.
	testTimeout: 20000,
};
