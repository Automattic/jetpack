/**
 * External dependencies
 */
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const path = require( 'path' );

module.exports = [
	{
		entry: {
			index: './src/js/index.js',
		},
		mode: jetpackWebpackConfig.mode,
		devtool: jetpackWebpackConfig.isDevelopment ? 'source-map' : false,
		output: {
			...jetpackWebpackConfig.output,
			filename: '[name].js',
			path: path.resolve( './build' ),
		},
		optimization: {
			...jetpackWebpackConfig.optimization,
		},
		resolve: {
			...jetpackWebpackConfig.resolve,
		},
		node: false,
		plugins: [
			...jetpackWebpackConfig.StandardPlugins( {
				DependencyExtractionPlugin: { injectPolyfill: true },
			} ),
		],
		module: {
			strictExportPresence: true,
			rules: [
				// Transpile JavaScript
				jetpackWebpackConfig.TranspileRule( {
					exclude: /node_modules\//,
				} ),

				// Transpile @automattic/jetpack-* in node_modules too.
				jetpackWebpackConfig.TranspileRule( {
					includeNodeModules: [ '@automattic/jetpack-' ],
				} ),

				// Handle CSS.
				{
					test: /\.(?:css|s[ac]ss)$/,
					use: [
						jetpackWebpackConfig.MiniCssExtractLoader(),
						jetpackWebpackConfig.CssCacheLoader(),
						jetpackWebpackConfig.CssLoader( {
							importLoaders: 1, // Set to the number of loaders after this one in the array, e.g. 2 if you use both postcss-loader and sass-loader.
						} ),
						'sass-loader',
					],
				},

				// Handle images.
				jetpackWebpackConfig.FileRule(),
			],
		},
	},
];
