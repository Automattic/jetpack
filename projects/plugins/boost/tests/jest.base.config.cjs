const path = require( 'path' );
const coverageConfig = require( 'jetpack-js-tools/jest/config.coverage.js' );
const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	rootDir: path.join( __dirname, '..' ),
	roots: [ '<rootDir>/app', '<rootDir>/_inc', '<rootDir>/routes', '<rootDir>/packages' ],
	testPathIgnorePatterns: [ '/node_modules/' ],
	testEnvironment: require.resolve( 'jetpack-js-tools/jest/fix-environment-jsdom.mjs' ),
	testEnvironmentOptions: baseConfig.testEnvironmentOptions,
	collectCoverageFrom: [
		'<rootDir>/app/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		'<rootDir>/_inc/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		...coverageConfig.collectCoverageFrom,
		'!<rootDir>/_inc/overview/jest.config.cjs',
	],
	// Reuse shared transforms without the optional jest-console setup.
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
