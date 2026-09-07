const { existsSync } = require( 'fs' );
const path = require( 'path' );
const coverageConfig = require( 'jetpack-js-tools/jest/config.coverage.js' );
const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

const config = {
	...coverageConfig,
	rootDir: path.join( __dirname, '..' ),
	roots: [ '<rootDir>/app', '<rootDir>/routes' ],
	testEnvironment: require.resolve( 'jetpack-js-tools/jest/fix-environment-jsdom.mjs' ),
	collectCoverageFrom: [
		'<rootDir>/app/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		...coverageConfig.collectCoverageFrom,
	],
	/*
	 * Reuse the shared transform so component modules can be tested: it stubs
	 * style/asset imports and compiles the JSX/TS (including the `@wordpress/*`
	 * sources pulled in from the pnpm store) that the RangeControl-based UI needs.
	 * We deliberately do NOT adopt config.base.js's setupFilesAfterEnv, which pulls
	 * in jest-dom and jest-console matchers that Boost does not depend on.
	 */
	transform: baseConfig.transform,
	transformIgnorePatterns: baseConfig.transformIgnorePatterns,
	setupFiles: baseConfig.setupFiles,
	// Mirror the TypeScript path aliases from tsconfig.json so tests can import
	// modules that use the `$lib`/`$features`/`$layout`/`$svg` aliases.
	moduleNameMapper: {
		'^\\$lib/(.*)$': '<rootDir>/app/assets/src/js/lib/$1',
		'^\\$features/(.*)$': '<rootDir>/app/assets/src/js/features/$1',
		'^\\$layout/(.*)$': '<rootDir>/app/assets/src/js/layout/$1',
		'^\\$svg/(.*)$': '<rootDir>/app/assets/src/js/svg/$1',
	},
};

const overviewConfig = path.join( __dirname, '../_inc/overview/jest.config.cjs' );
module.exports = existsSync( overviewConfig )
	? {
			projects: [
				{ ...config, testPathIgnorePatterns: [ '/node_modules/', '<rootDir>/_inc/overview/' ] },
				overviewConfig,
			],
	  }
	: config;
