/**
 * External dependencies
 */
const getBaseWebpackConfig = require( '@automattic/calypso-build/webpack.config.js' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const {
	defaultRequestToExternal,
	defaultRequestToHandle,
} = require( '@wordpress/dependency-extraction-webpack-plugin/lib/util' );
const path = require( 'path' );
const webpack = require( 'webpack' );

/**
 * Internal dependencies
 */
const {
	definePaletteColorsAsStaticVariables,
	defineReadableJSAssetsPluginForSearch,
} = require( './webpack.helpers' );

const isDevelopment = process.env.NODE_ENV !== 'production';

const baseWebpackConfig = getBaseWebpackConfig(
	{ WP: false },
	{
		entry: {
			main: path.join( __dirname, '../modules/search/instant-search/loader.js' ),
		},
		// Putting a cache buster in the query string is not documented, but confirmed by the author of Webpack.
		// `But better use the hash in filename and use no query parameter.`
		// The reason probably is because it's not the best way to do cache busting.
		// More information: https://github.com/webpack/webpack/issues/2329
		'output-chunk-filename': 'jp-search.chunk-[name]-[contenthash:20].min.js',
		'output-filename': 'jp-search-[name].bundle.min.js',
		'output-path': path.join( __dirname, '../_inc/build/instant-search' ),
		// Calypso-build defaults this to "window", which breaks things if no library.name is set.
		'output-library-target': '',
	}
);

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

const moduleConfig = { ...baseWebpackConfig.module };
// NOTE: tiny-lru publishes non-ES5 as a browser target. It's necessary to let babel-loader transpile this module.
moduleConfig.rules[ 0 ].exclude = /[\\/]node_modules[\\/](?!(\.pnpm|tiny-lru)[\\/])/;

module.exports = {
	...baseWebpackConfig,
	module: moduleConfig,
	resolve: {
		...baseWebpackConfig.resolve,
		alias: {
			...baseWebpackConfig.resolve.alias,
			react: 'preact/compat',
			'react-dom/test-utils': 'preact/test-utils',
			'react-dom': 'preact/compat', // Must be aliased after test-utils
			fs: false,
		},
		modules: [
			path.resolve( __dirname, '../_inc/client' ),
			path.resolve( __dirname, '../node_modules' ),
			'node_modules',
		],
		// We want the compiled version, not the "calypso:src" sources.
		mainFields: baseWebpackConfig.resolve.mainFields.filter( entry => 'calypso:src' !== entry ),
	},
	devtool: isDevelopment ? 'source-map' : false,
	plugins: [
		...baseWebpackConfig.plugins,
		// Replace 'debug' module with a dummy implementation in production
		...( isDevelopment
			? []
			: [
					new webpack.NormalModuleReplacementPlugin(
						/^debug$/,
						path.resolve( __dirname, '../modules/search/instant-search/lib/dummy-debug' )
					),
			  ] ),
		new DependencyExtractionWebpackPlugin( {
			injectPolyfill: true,
			useDefaults: false,
			requestToExternal,
			requestToHandle: defaultRequestToHandle,
		} ),
		definePaletteColorsAsStaticVariables(),
		defineReadableJSAssetsPluginForSearch(),
	],
	optimization: {
		...baseWebpackConfig.optimization,
		splitChunks: {
			cacheGroups: {
				vendors: false,
			},
		},
		// This optimization sometimes causes webpack to drop `__()` and such.
		concatenateModules: false,
	},
};
