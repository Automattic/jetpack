const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = {
	entry: {
		index: './src/js/index.jsx',
	},
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	output: {
		...jetpackWebpackConfig.output,
		path: path.resolve( './build' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
	},
	node: false,
	plugins: [ ...jetpackWebpackConfig.StandardPlugins() ],
	module: {
		strictExportPresence: true,
		rules: [
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@automattic/' ],
			} ),
			...jetpackWebpackConfig.BundledWpPkgsTranspileRules(),
			jetpackWebpackConfig.CssRule( {
				extensions: [ 'css' ],
			} ),
			jetpackWebpackConfig.FileRule(),
		],
	},
};
