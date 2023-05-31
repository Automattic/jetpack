const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const socialWebpackConfig = {
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

			// Transpile @automattic/* in node_modules too.
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@automattic/' ],
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
};

module.exports = [
	{
		...socialWebpackConfig,
		entry: {
			editor: './src/js/editor.js',
		},
		module: {
			...socialWebpackConfig.module,
			rules: [
				...socialWebpackConfig.module.rules,
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
			],
		},
	},
	{
		...socialWebpackConfig,
		entry: {
			index: './src/js/index.js',
		},
		module: {
			...socialWebpackConfig.module,
			rules: [
				...socialWebpackConfig.module.rules,
				// Handle CSS.
				jetpackWebpackConfig.CssRule( {
					extensions: [ 'css', 'sass', 'scss' ],
					extraLoaders: [
						{
							loader: 'postcss-loader',
							options: {
								postcssOptions: {
									plugins: {
										'postcss-custom-properties': {
											disableDeprecationNotice: true,
										},
										autoprefixer: {},
									},
								},
							},
						},
						'sass-loader',
					],
				} ),
			],
		},
	},
];
