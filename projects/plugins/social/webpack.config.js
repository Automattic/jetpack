const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = [
	{
		entry: {
			index: './src/js/index.js',
			editor: './src/js/editor.js',
		},
		mode: jetpackWebpackConfig.mode,
		devtool: jetpackWebpackConfig.isDevelopment ? 'source-map' : false,
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

				// Transpile @automattic/g* in node_modules too.
				jetpackWebpackConfig.TranspileRule( {
					includeNodeModules: [ '@automattic/' ],
				} ),

				// Handle CSS.
				jetpackWebpackConfig.CssRule( {
					extensions: [ 'css', 'sass', 'scss' ],
					extraLoaders: [
						{
							loader: 'postcss-loader',
							options: {
								postcssOptions: { config: path.join( __dirname, 'postcss.config.js' ) },
							},
						},
						'sass-loader',
					],
				} ),

				// Handle images.
				jetpackWebpackConfig.FileRule(),
			],
		},
		externals: {
			...jetpackWebpackConfig.externals,
			jetpackConfig: JSON.stringify( {
				consumer_slug: 'jetpack-social',
			} ),
		},
	},
];
