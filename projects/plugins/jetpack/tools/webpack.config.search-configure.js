/**
 * External dependencies
 */
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const {
	definePaletteColorsAsStaticVariables,
	defineReadableJSAssetsPluginForSearch,
} = require( './webpack.helpers' );

module.exports = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.isDevelopment ? 'source-map' : false,
	entry: {
		main: path.join( __dirname, '../modules/search/customberg/index.jsx' ),
	},
	output: {
		...jetpackWebpackConfig.output,
		// @todo: Make the file naming regular.
		filename: 'jp-search-configure-[name].min.js',
		chunkFilename: 'jp-search-configure-[name].[contenthash:20].min.js',
		path: path.join( __dirname, '../_inc/build/instant-search' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
		alias: {
			...jetpackWebpackConfig.resolve.alias,
			fs: false,
		},
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: { injectPolyfill: true },
			MiniCssExtractPlugin: {
				filename: 'jp-search-configure-[name].min.css',
				chunkFilename: 'jp-search-configure-[name].[contenthash:20].min.css',
			},
		} ),
		definePaletteColorsAsStaticVariables(),
		defineReadableJSAssetsPluginForSearch(),
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
				includeNodeModules: [ '@automattic/jetpack-', 'debug/', 'tiny-lru/' ],
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
