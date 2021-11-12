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
const { definePaletteColorsAsStaticVariables } = require( './webpack.helpers' );

/**
 * Determines if the module import request should be externalized.
 *
 * @param {string} request - Requested module
 * @returns {(string|string[]|undefined)} Script global
 */
function requestToExternal( request ) {
	// Prevent React from being externalized. This ensures that React will be properly aliased to preact/compat.
	if ( request === 'react' || request === 'react-dom' ) {
		return;
	}
	return defaultRequestToExternal( request );
}

module.exports = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.isDevelopment ? 'source-map' : false,
	entry: {
		'jp-search-main': path.join( __dirname, '../modules/search/instant-search/loader.js' ),
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '../_inc/build/instant-search' ),
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
		} ),
		// Replace 'debug' module with a dummy implementation in production
		...( jetpackWebpackConfig.isDevelopment
			? []
			: [
					new webpack.NormalModuleReplacementPlugin(
						/^debug$/,
						path.resolve( __dirname, '../modules/search/instant-search/lib/dummy-debug' )
					),
			  ] ),
		definePaletteColorsAsStaticVariables(),
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
