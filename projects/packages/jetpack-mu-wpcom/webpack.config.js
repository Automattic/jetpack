const path = require( 'path' );
const jetpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = {
	entry: {
		'error-reporting': './src/features/error-reporting/index.js',
	},
	mode: jetpackConfig.mode,
	devtool: jetpackConfig.devtool,
	output: {
		...jetpackConfig.output,
		filename: '[name]/[name].js',
		path: path.resolve( __dirname, 'src/build' ),
	},
	optimization: {
		...jetpackConfig.optimization,
	},
	resolve: {
		...jetpackConfig.resolve,
	},
	node: false,
	plugins: [ ...jetpackConfig.StandardPlugins() ],
	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript.
			jetpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),

			// Transpile @automattic/jetpack-* in node_modules too.
			jetpackConfig.TranspileRule( {
				includeNodeModules: [ '@automattic/jetpack-' ],
			} ),

			// Handle CSS.
			jetpackConfig.CssRule(),

			// Handle images.
			jetpackConfig.FileRule(),
		],
	},
};
