const path = require( 'path' );

module.exports = {
	testEnvironment: 'jsdom',
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
		// Note: Keep the patterns here in sync with tools/js-tools/eslintrc/base.js.
		'<rootDir>/**/__tests__/**/*.[jt]s?(x)',
		'<rootDir>/**/?(*.)+(spec|test).[jt]s?(x)',
		'<rootDir>/**/test/*.[jt]s?(x)',
		'!**/.eslintrc.*',
	],
	moduleNameMapper: {
		jetpackConfig: path.join( __dirname, 'jest-jetpack-config.js' ),
	},
	testPathIgnorePatterns: [ '/node_modules/', '<rootDir>/vendor/', '<rootDir>/jetpack_vendor/' ],
	setupFiles: [ path.join( __dirname, 'setup-globals.js' ) ],
	setupFilesAfterEnv: [ path.join( __dirname, 'setup-after-env.js' ) ],
	extensionsToTreatAsEsm: [ '.jsx', '.ts', '.tsx' ],
	resolver: require.resolve( 'jetpack-js-tools/jest/jest-resolver.js' ),
};
