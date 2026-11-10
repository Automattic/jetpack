const path = require( 'path' );
const nodeConfig = require( './config.node.js' );
const { transformIgnorePattern } = require( './transform-ignore.js' );

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
		'\\.m?[jt]sx?$': [
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
	transformIgnorePatterns: [ transformIgnorePattern() ],
	moduleNameMapper: {
		jetpackConfig: path.join( __dirname, 'jest-jetpack-config.js' ),
		// Give @automattic/charts a measured parent, which jsdom's lack of layout denies it.
		'^@visx/responsive$': path.join( __dirname, 'visx-responsive-stub.cjs' ),
	},
	setupFiles: [ path.join( __dirname, 'setup-globals.js' ) ],
	setupFilesAfterEnv: [
		path.join( __dirname, 'setup-jest-dom.js' ),
		path.join( __dirname, 'setup-console.js' ),
		path.join( __dirname, 'setup-client-zip.js' ),
	],
	extensionsToTreatAsEsm: [ '.jsx', '.ts', '.tsx' ],
};
