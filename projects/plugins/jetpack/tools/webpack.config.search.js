/**
 * External dependencies
 */
const getBaseWebpackConfig = require( '@automattic/calypso-build/webpack.config.js' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const {
	defaultRequestToExternal,
	defaultRequestToHandle,
} = require( '@wordpress/dependency-extraction-webpack-plugin/util' );
const path = require( 'path' );

const isDevelopment = process.env.NODE_ENV !== 'production';

const baseWebpackConfig = getBaseWebpackConfig(
	{ WP: false },
	{
		entry: {
			main: path.join( __dirname, '../modules/search/instant-search/index.jsx' ),
			'ie11-polyfill-loader': path.join(
				__dirname,
				'../modules/search/instant-search/ie11-polyfill.js'
			),
			'ie11-polyfill-payload': [ 'core-js', 'regenerator-runtime/runtime' ],
		},
		'output-chunk-filename': 'jp-search.chunk-[name]-[hash].js',
		'output-filename': 'jp-search-[name].bundle.js',
		'output-path': path.join( __dirname, '../_inc/build/instant-search' ),
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
moduleConfig.rules[ 0 ].exclude = /[\\/]node_modules[\\/](?!(tiny-lru)[\\/])/;

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
		},
		modules: [
			path.resolve( __dirname, '../_inc/client' ),
			path.resolve( __dirname, '../node_modules' ),
		],
	},
	node: {
		fs: 'empty',
	},
	devtool: isDevelopment ? 'source-map' : false,
	plugins: [
		...baseWebpackConfig.plugins,
		new DependencyExtractionWebpackPlugin( {
			injectPolyfill: true,
			useDefaults: false,
			requestToExternal,
			requestToHandle: defaultRequestToHandle,
		} ),
	],
};
