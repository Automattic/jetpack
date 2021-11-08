/**
 * External dependencies
 */
const path = require( 'path' );
const getBaseWebpackConfig = require( '@automattic/calypso-build/webpack.config.js' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

const isDevelopment = process.env.NODE_ENV !== 'production';

const baseWebpackConfig = getBaseWebpackConfig(
	{ WP: false },
	{
		entry: {
			main: path.join( __dirname, '../src/js/dashboard/index.jsx' ),
		},
		'output-filename': 'jp-search-dashboard-[name].min.js',
		'output-chunk-filename': 'jp-search-dashboard-[name].[contenthash].min.js',
		'output-path': path.join( __dirname, '../build/instant-search' ),
		// Calypso-build defaults this to "window", which breaks things if no library.name is set.
		'output-library-target': '',
	}
);

module.exports = {
	...baseWebpackConfig,
	optimization: {
		...baseWebpackConfig.optimization,
		// This optimization sometimes causes webpack to drop `__()` and such.
		concatenateModules: false,
	},
	resolve: {
		...baseWebpackConfig.resolve,
		modules: [
			path.resolve( __dirname, '../node_modules' ),
			'node_modules',
			path.join( __dirname, '../src/js/dashboard/' ),
			'lodash',
		],
		alias: {
			fs: false,
		},
	},
	devtool: isDevelopment ? 'source-map' : false,
	plugins: [
		...baseWebpackConfig.plugins,
		new DependencyExtractionWebpackPlugin( { injectPolyfill: true } ),
	],
};
