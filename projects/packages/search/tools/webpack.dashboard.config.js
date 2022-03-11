/**
 * External dependencies
 */
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const path = require( 'path' );

module.exports = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.isDevelopment ? 'source-map' : false,
	entry: {
		'jp-search-dashboard': path.join( __dirname, '../src/dashboard/index.jsx' ),
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '../build/dashboard' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
		splitChunks: {
			cacheGroups: {
				vendors: false,
			},
		},
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
		alias: {
			...jetpackWebpackConfig.resolve.alias,
			fs: false,
			'instant-search': path.join( __dirname, '../src/instant-search' ),
		},
		modules: [ path.resolve( __dirname, '../src/dashboard' ), 'node_modules' ],
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: {
				injectPolyfill: true,
			},
		} ),
	],
	externals: {
		jetpackConfig: JSON.stringify( {
			consumer_slug: 'jetpack-search-package',
		} ),
	},
	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),

			//  Transpile @automattic/jetpack-* in node_modules too.
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
							postcssOptions: { config: path.join( __dirname, '../postcss.config.js' ) },
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
