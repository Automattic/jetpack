/**
 * External dependencies
 */
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const {
	defaultRequestToExternal,
	defaultRequestToHandle,
} = require( '@wordpress/dependency-extraction-webpack-plugin/lib/util' );
const path = require( 'path' );
const webpack = jetpackWebpackConfig.webpack;

/**
 * Internal dependencies
 */
const definePaletteColorsAsStaticVariables = require( './define-palette-colors-as-static-variables' );
const AddReadableJSAssetsPlugin = require( './add-readable-js-assets' );

/**
 * Used to determine if the module import request should be externalized.
 * For instant search, we prevent react and react-dom from being externalized by the Gutenberg toolchain.
 * This enables us to alias Preact to all React imports.
 *
 * @param {string} request - Requested module
 * @returns {(string|string[]|undefined)} Script global
 */
function requestToExternal( request ) {
	// Ensure that React will be aliased to preact/compat by preventing externalization.
	if ( request === 'react' || request === 'react-dom' ) {
		return;
	}
	return defaultRequestToExternal( request );
}

module.exports = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.isDevelopment ? 'source-map' : false,
	entry: {
		main: path.join( __dirname, '../src/instant-search/loader.js' ),
	},
	output: {
		...jetpackWebpackConfig.output,
		// @todo: Make the file naming regular.
		filename: 'jp-search-[name].bundle.min.js',
		chunkFilename: 'jp-search.chunk-[name].[contenthash:20].min.js',
		path: path.join( __dirname, 'build/instant-search' ),
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
			react: 'preact/compat',
			'react-dom/test-utils': 'preact/test-utils',
			'react-dom': 'preact/compat', // Must be aliased after test-utils
			fs: false,
		},
		modules: [ path.resolve( __dirname, '../_inc/client' ), 'node_modules' ],
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: {
				injectPolyfill: true,
				useDefaults: false,
				requestToExternal,
				requestToHandle: defaultRequestToHandle,
			},
			MiniCssExtractPlugin: {
				filename: 'jp-search-[name].bundle.min.css',
				chunkFilename: 'jp-search.chunk-[name].[contenthash:20].min.css',
			},
		} ),
		// Replace 'debug' module with a dummy implementation in production
		...( jetpackWebpackConfig.isDevelopment
			? []
			: [
					new webpack.NormalModuleReplacementPlugin(
						/^debug$/,
						path.resolve( __dirname, '../src/instant-search/lib/dummy-debug' )
					),
			  ] ),
		definePaletteColorsAsStaticVariables(),
		new AddReadableJSAssetsPlugin(),
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

module.exports = instantSearchConfig;
