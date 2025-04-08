const path = require( 'path' );

module.exports = {
	testEnvironment: path.join( __dirname, 'fix-environment-jsdom.mjs' ),
	testEnvironmentOptions: {
		// Note we need to repeat the environment's default conditions here too, sigh.
		customExportConditions: [
			'browser',
			...( process.env.npm_config_jetpack_webpack_config_resolve_conditions
				? process.env.npm_config_jetpack_webpack_config_resolve_conditions.split( ',' )
				: [] ),
		],
	},
	transform: {
		'\\.(gif|jpg|jpeg|png|svg|scss|sass|css|ttf|woff|woff2)$': path.join(
			__dirname,
			'jest-extensions-asset-stub.js'
		),
		'\\.[jt]sx?$': [
			require.resolve( 'babel-jest' ),
			{
				presets: [
					[ require.resolve( '@babel/preset-react' ), { runtime: 'automatic' } ],
					require.resolve( '@babel/preset-typescript' ),
				],
			},
		],
	},
	testMatch: [
		// Note: Keep the patterns here in sync with ./config.coverage.js and tools/js-tools/eslintrc/base.mjs.
		'<rootDir>/**/__tests__/**/*.[jt]s?(x)',
		'<rootDir>/**/?(*.)+(spec|test).[jt]s?(x)',
		'<rootDir>/**/test/*.[jt]s?(x)',
		'!**/eslint.config.?([mc])[jt]s',
	],
	moduleNameMapper: {
		jetpackConfig: path.join( __dirname, 'jest-jetpack-config.js' ),
	},
	testPathIgnorePatterns: [ '/node_modules/', '<rootDir>/vendor/', '<rootDir>/jetpack_vendor/' ],
	setupFiles: [ path.join( __dirname, 'setup-globals.js' ) ],
	setupFilesAfterEnv: [
		path.join( __dirname, 'setup-jest-dom.js' ),
		path.join( __dirname, 'setup-console.js' ),
		path.join( __dirname, 'setup-client-zip.js' ),
	],
	extensionsToTreatAsEsm: [ '.jsx', '.ts', '.tsx' ],
	resolver: require.resolve( 'jetpack-js-tools/jest/jest-resolver.js' ),

	...require( './config.coverage.js' ),
};
