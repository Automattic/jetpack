process.env.NODE_ENV = 'production';

const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = {
	entry: './src/index.mjs',
	mode: jetpackWebpackConfig.mode,
	devtool: false,
	output: {
		...jetpackWebpackConfig.output,
		library: {
			name: 'Test',
			type: 'var',
		},
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
		concatenateModules: true,
	},
	resolve: jetpackWebpackConfig.resolve,
	node: false,
	plugins: jetpackWebpackConfig.StandardPlugins(),
	module: {
		strictExportPresence: true,
		rules: [
			jetpackWebpackConfig.TranspileRule(),
		],
	},
};
