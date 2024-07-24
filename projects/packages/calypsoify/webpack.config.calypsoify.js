const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = [
	{
		entry: {
			index: './src/js/mods-gutenberg.js',
		},
		mode: jetpackWebpackConfig.mode,
		devtool: jetpackWebpackConfig.devtool,
		output: jetpackWebpackConfig.output,
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
				// Transpile JavaScript
				jetpackWebpackConfig.TranspileRule( {
					exclude: /node_modules\//,
				} ),
				// Handle CSS.
				jetpackWebpackConfig.CssRule( {
					extensions: [ 'css', 'sass', 'scss' ],
					extraLoaders: [ 'sass-loader' ],
				} ),
			],
		},
		externals: {
			...jetpackWebpackConfig.externals,
			jetpackConfig: JSON.stringify( {
				consumer_slug: 'jetpack_calypsoify',
			} ),
		},
	},
];
