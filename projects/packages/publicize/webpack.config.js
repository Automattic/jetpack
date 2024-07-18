const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

/**
 * @type {import('webpack').Configuration[]} Webpack configuration.
 */
const sharedConfig = {
	entry: {
		[ 'classic-editor-share-limits' ]: './src/js/classic-editor-share-limits.js',
		[ 'classic-editor-connections' ]: './src/js/classic-editor-connections.js',
	},
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
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
	plugins: [ ...jetpackWebpackConfig.StandardPlugins() ],
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
};

/**
 * @type {import('webpack').Configuration[]} Webpack configuration.
 */
module.exports = [
	{
		...sharedConfig,
		entry: {
			[ 'classic-editor-share-limits' ]: './src/js/classic-editor-share-limits.js',
			[ 'classic-editor-connections' ]: './src/js/classic-editor-connections.js',
		},
		plugins: [ ...jetpackWebpackConfig.StandardPlugins() ],
	},
	{
		...sharedConfig,
		entry: {
			[ 'jetpack-publicize' ]: {
				import: './src/js/jetpack-publicize.js',
				library: {
					name: 'JetpackPublicize',
					type: 'umd',
				},
			},
		},
		externals: {
			...jetpackWebpackConfig.externals,
			jetpackConfig: JSON.stringify( {
				consumer_slug: 'jetpack-publicize',
			} ),
		},
		plugins: [
			...jetpackWebpackConfig.StandardPlugins( {
				DependencyExtractionPlugin: {
					requestMap: {
						// We don't want to externalize this package, we rather want to bundle it.
						'@automattic/jetpack-publicize-components': {},
					},
				},
			} ),
		],
	},
];
