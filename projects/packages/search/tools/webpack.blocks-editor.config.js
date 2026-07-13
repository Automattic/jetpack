/**
 * Editor script build for Jetpack Search blocks.
 *
 * Separate from the ESM view-script build (webpack.blocks.config.js) because
 * this target consumes `@wordpress/*` packages via the classic dependency-
 * extraction plugin (globals, not ES modules) — mixing that with
 * viewScriptModule output in one config is messy.
 */

const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	entry: {
		'register-blocks': path.join( __dirname, '../src/search-blocks/editor/register-blocks.jsx' ),
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '../build/search-blocks-editor' ),
		filename: '[name].js',
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
	},
	module: {
		strictExportPresence: true,
		rules: [
			jetpackWebpackConfig.TranspileRule( { exclude: /node_modules\// } ),
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@automattic/jetpack-' ],
			} ),
			jetpackWebpackConfig.FileRule(),
		],
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: { injectPolyfill: false },
		} ),
	],
};
