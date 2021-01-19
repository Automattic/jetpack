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
		entry: { search: path.join( __dirname, '../modules/search/instant-search/index.jsx' ) },
		'output-chunk-filename': 'jp-search.chunk-[name]-[hash].js',
		'output-filename': 'jp-search.bundle.js',
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

module.exports = {
	...baseWebpackConfig,
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
