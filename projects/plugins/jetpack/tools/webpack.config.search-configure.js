/**
 * External dependencies
 */
const path = require( 'path' );
const getBaseWebpackConfig = require( '@automattic/calypso-build/webpack.config.js' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

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
			main: path.join( __dirname, '../modules/search/customberg/index.jsx' ),
		},
		'output-filename': 'jp-search-configure-[name].min.js',
		'output-chunk-filename': 'jp-search-configure-[name].[contenthash:20].min.js',
		'output-path': path.join( __dirname, '../_inc/build/instant-search' ),
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
			// Allow importing from instant search path
			path.resolve( __dirname, '../node_modules' ),
			'node_modules',
		],
		alias: {
			fs: false,
		},
	},
	devtool: isDevelopment ? 'source-map' : false,
	plugins: [
		...baseWebpackConfig.plugins,
		new DependencyExtractionWebpackPlugin( { injectPolyfill: true } ),
		definePaletteColorsAsStaticVariables(),
		defineReadableJSAssetsPluginForSearch(),
	],
};
