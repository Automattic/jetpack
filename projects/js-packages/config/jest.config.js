// Note we intentionally don't use jetpack-js-tools/jest/config.base.js here.
// This doesn't need jsdom or any of the other fancy stuff, but it does need to avoid the
// standard jest-jetpack-config.js mocking.
const coverageConfig = require( 'jetpack-js-tools/jest/config.coverage.js' );

module.exports = {
	...coverageConfig,
	testMatch: [ '<rootDir>/**/test/*.[jt]s' ],
	resolver: require.resolve( 'jetpack-js-tools/jest/jest-resolver.js' ),
};
