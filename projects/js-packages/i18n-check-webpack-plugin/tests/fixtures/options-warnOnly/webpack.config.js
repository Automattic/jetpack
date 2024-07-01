process.env.NODE_ENV = 'production';

const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = {
	entry: './src/index.js',
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	output: jetpackWebpackConfig.output,
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: jetpackWebpackConfig.resolve,
	node: false,
	plugins: jetpackWebpackConfig.StandardPlugins( {
		I18nCheckPlugin: {
			warnOnly: true,
		},
	} ),
	module: {
		strictExportPresence: true,
		rules: [
			jetpackWebpackConfig.TranspileRule(),
		],
	},
};
