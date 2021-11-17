/**
 * External dependencies
 */
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const AddReadableJSAssetsPlugin = require( './add-readable-js-assets' );

module.exports = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.isDevelopment ? 'source-map' : false,
	entry: {
		main: path.join( __dirname, '../src/dashboard/index.jsx' ),
	},
	output: {
		...jetpackWebpackConfig.output,
		// @todo: Make the file naming regular.
		filename: 'jp-search-dashboard-[name].min.js',
		chunkFilename: 'jp-search-dashboard.chunk-[name].[contenthash:20].min.js',
		path: path.join( __dirname, '../dist/instant-search' ),
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
			fs: false,
		},
		modules: [ path.resolve( __dirname, '../src/dashboard' ), 'node_modules' ],
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: {
				injectPolyfill: true,
				useDefaults: false,
			},
			MiniCssExtractPlugin: {
				filename: 'jp-search-dashboard-[name].min.css',
				chunkFilename: 'jp-search-dashboard.chunk-[name].[contenthash:20].min.css',
			},
		} ),
		new AddReadableJSAssetsPlugin(),
	],
	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript except node modules.
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
						importLoaders: 2, // Set to the number of loaders after this one in the array, e.g. 2 if you use both postcss-loader and sass-loader.
					} ),
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: { config: path.join( __dirname, '../postcss.config.js' ) },
						},
					},
					'sass-loader',
				],
			},

			// Handle images.
			jetpackWebpackConfig.FileRule(),
		],
	},
};
