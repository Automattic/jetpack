const path = require( 'path' );
const coverageConfig = require( 'jetpack-js-tools/jest/config.coverage.js' );

module.exports = {
	...coverageConfig,
	rootDir: path.join( __dirname, '..' ),
	testEnvironment: require.resolve( 'jetpack-js-tools/jest/fix-environment-jsdom.mjs' ),
	collectCoverageFrom: [
		'<rootDir>/app/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		...coverageConfig.collectCoverageFrom,
	],
	// Mirror the TypeScript path aliases from tsconfig.json so tests can import
	// modules that use the `$lib`/`$features`/`$layout`/`$svg` aliases.
	moduleNameMapper: {
		'^\\$lib/(.*)$': '<rootDir>/app/assets/src/js/lib/$1',
		'^\\$features/(.*)$': '<rootDir>/app/assets/src/js/features/$1',
		'^\\$layout/(.*)$': '<rootDir>/app/assets/src/js/layout/$1',
		'^\\$svg/(.*)$': '<rootDir>/app/assets/src/js/svg/$1',
	},
};
