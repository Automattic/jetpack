process.env.NODE_ENV = 'production';

const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = {
	entry: {
		main: './src/index.js',
		css: './src/css.css',
	},
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	output: jetpackWebpackConfig.output,
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: jetpackWebpackConfig.resolve,
	node: false,
	plugins: jetpackWebpackConfig.StandardPlugins( {
		I18nLoaderPlugin: { textdomain: 'domain' },
	} ),
	module: {
		strictExportPresence: true,
		rules: [
			jetpackWebpackConfig.TranspileRule(),
			jetpackWebpackConfig.CssRule(),
		],
	},
};
