const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = {
	entry: './src/index.ts',
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	module: {
		strictExportPresence: true,
		rules: [
			{
				test: /\.ts?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.resolve( __dirname, 'build' ),
		filename: 'index.js',
		library: {
			name: 'BoostScoreApiLibrary',
			type: 'umd',
		},
	},
	plugins: [ ...jetpackWebpackConfig.StandardPlugins() ],
};
