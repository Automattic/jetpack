const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = [
	{
		entry: {
			'block-editor/index': './src/client/block-editor/index.js',
			'block-editor/view': './src/client/block-editor/view.js',
			'lib/videopress-token-bridge': './src/client/lib/videopress-token-bridge.js',
			'admin/index': './src/client/admin/index.js',
			'block-editor/extensions/index': './src/client/block-editor/extensions/index.js',
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

				// Transpile @automattic/jetpack-* in node_modules too.
				jetpackWebpackConfig.TranspileRule( {
					includeNodeModules: [ '@automattic/jetpack-' ],
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
				consumer_slug: 'jetpack-videopress',
			} ),
		},
	},
];
