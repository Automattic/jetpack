process.env.NODE_ENV = 'production';

// Cross-project deps are ugh, but pnpm whines about "cyclic dependencies" if we try to make it an actual devDepenency.
const jetpackWebpackConfig = require( '../../../../webpack-config/src/webpack.js' );

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
