const path = require( 'path' );
const coverageConfig = require( 'jetpack-js-tools/jest/config.coverage.js' );
const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...coverageConfig,
	rootDir: path.join( __dirname, '..' ),
	roots: [ '<rootDir>/app', '<rootDir>/_inc', '<rootDir>/routes', '<rootDir>/packages' ],
	testPathIgnorePatterns: [ '/node_modules/', '<rootDir>/tests/e2e/' ],
	testEnvironment: require.resolve( 'jetpack-js-tools/jest/fix-environment-jsdom.mjs' ),
	testEnvironmentOptions: baseConfig.testEnvironmentOptions,
	collectCoverageFrom: [
		...[ 'app', '_inc', 'routes', 'packages' ].map(
			directory => `<rootDir>/${ directory }/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}`
		),
		...coverageConfig.collectCoverageFrom,
	],
	/*
	 * Reuse the shared transform so component modules can be tested: it stubs
	 * style/asset imports and compiles the JSX/TS (including the `@wordpress/*`
	 * sources pulled in from the pnpm store) that the RangeControl-based UI needs.
	 * We deliberately do NOT adopt config.base.js's setupFilesAfterEnv, which pulls
	 * in jest-dom and jest-console matchers that Boost does not depend on.
	 */
	transform: {
		...baseConfig.transform,
		'\\.m?[jt]sx?$': [
			baseConfig.transform[ '\\.m?[jt]sx?$' ][ 0 ],
			{
				...baseConfig.transform[ '\\.m?[jt]sx?$' ][ 1 ],
				// Keep plugin options serializable for Jest worker processes.
				plugins: [ require.resolve( './babel-plugin-import-meta-url.cjs' ) ],
			},
		],
	},
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
