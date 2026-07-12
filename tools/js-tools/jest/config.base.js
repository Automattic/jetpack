const path = require( 'path' );
const nodeConfig = require( './config.node.js' );

module.exports = {
	...nodeConfig,
	testEnvironment: path.join( __dirname, 'fix-environment-jsdom.mjs' ),
	testEnvironmentOptions: {
		// Note we need to repeat the environment's default conditions here too, sigh.
		customExportConditions: [ 'browser', 'jetpack:src' ],
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
					[ require.resolve( '@babel/preset-typescript' ), { allowDeclareFields: true } ],
				],
				overrides: [
					{
						// A RegExp can't be serialized, but a function wrapping one can. 🤷
						test: filename => /\.[jt]sx$/.test( filename ),
						presets: [ [ require.resolve( '@babel/preset-react' ), { runtime: 'automatic' } ] ],
					},
				],
			},
		],
	},
	// Unignore certain node_modules
	// - uplot: for packages/components
	// - @wordpress/admin-ui: for the unified admin page header styles
	// - @gravatar-com: for the lifted Gravatar component's hovercard styles
	// - marked: esm-only
	// - uuid: v14 went esm-only, so it needs transforming
	transformIgnorePatterns: [
		'/node_modules/(?!\\.pnpm|marked/|uuid/|uplot/.*\\.css|@wordpress/admin-ui/.*\\.css|@gravatar-com/.*\\.css)',
	],
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
