/**
 * Webpack configuration for building JavaScript (ES) modules.
 */
const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

const { mode, devtool, output, optimization, resolve } = jetpackWebpackConfig;

/** @type {import('webpack').Configuration} */
module.exports = {
	mode,
	devtool,
	optimization,
	resolve,
	node: false,
	name: 'jetpack-mu-wpcom/modules',
	entry: {
		'code-editor': './src/features/code-editor/code-editor/code-editor.tsx',
		codemirror: './src/features/code-editor/codemirror/codemirror.ts',
		'site-additional-css': './src/features/code-editor/site-additional-css/site-additional-css.ts',
	},
	output: {
		...output,
		filename: '[name]/[name].js',
		path: path.resolve( __dirname, 'src/build-module' ),
		module: true,
		chunkFormat: 'module',
		asyncChunks: false,
		environment: { module: true },
		library: { type: 'module' },
	},
	experiments: {
		outputModule: true,
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: {
				requestToExternalModule( request ) {
					if ( request === '@a8cCodeEditor/codemirror-bundle' ) {
						return true;
					}
				},
				combineAssets: true,
			},
			I18nLoaderPlugin: false,
			I18nCheckPlugin: false,
		} ),
	],

	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript.
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),
		],
	},
};
