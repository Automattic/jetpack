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
	// Raised above Jest's 5s default so the `SETTLE` windows the route-stage
	// suites pass to `findBy*` can actually elapse. Those stages render
	// behind several sequential requests and have taken well over a second
	// on a loaded runner under coverage, which is why they ask for a longer
	// deadline than Testing Library's 1s default — but Jest's own timeout
	// fires first when it is lower, killing the test with a bare "Exceeded
	// timeout" instead of Testing Library's "Unable to find an element with
	// the text …" plus the rendered DOM. Losing that dump is losing the one
	// thing that says what actually went wrong on CI.
	testTimeout: 20000,
};
