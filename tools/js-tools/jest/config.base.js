const path = require( 'path' );
const nodeConfig = require( './config.node.js' );

module.exports = {
	...nodeConfig,
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
		'\\.(gif|jpg|jpeg|png|webp|svg|scss|sass|css|ttf|woff|woff2)$': path.join(
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
	// Unignore certain node_modules CSS so the asset-stub transform can handle them.
	// - uplot: for packages/components
	// - @wordpress/admin-ui: for the unified admin page header styles
	transformIgnorePatterns: [ '/node_modules/(?!.*uplot.*\\.css|.*@wordpress/admin-ui/.*\\.css)' ],
	moduleNameMapper: {
		jetpackConfig: path.join( __dirname, 'jest-jetpack-config.js' ),
	},
	setupFiles: [ path.join( __dirname, 'setup-globals.js' ) ],
	setupFilesAfterEnv: [
		path.join( __dirname, 'setup-jest-dom.js' ),
		path.join( __dirname, 'setup-console.js' ),
		path.join( __dirname, 'setup-client-zip.js' ),
	],
	extensionsToTreatAsEsm: [ '.jsx', '.ts', '.tsx' ],
};
