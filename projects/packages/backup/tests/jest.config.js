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
	// Must stay above the `asyncUtilTimeout` set in jest.setup.js: whichever
	// fires first owns the failure, and Jest's own timeout reports a bare
	// "Exceeded timeout" where Testing Library reports the missing element
	// plus the rendered DOM. On CI that dump is the only account of what went
	// wrong.
	testTimeout: 20000,
};
