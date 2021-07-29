/**
 * External dependencies
 */
const path = require( 'path' );
const getBaseWebpackConfig = require( '@automattic/calypso-build/webpack.config.js' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

/**
 * Internal dependencies
 */
const { definePaletteColorsAsStaticVariables } = require( './webpack.helpers' );

const isDevelopment = process.env.NODE_ENV !== 'production';

const baseWebpackConfig = getBaseWebpackConfig(
	{ WP: false },
	{
		entry: {
			main: path.join( __dirname, '../modules/search/customberg/index.jsx' ),
		},
		'output-filename': 'jp-search-configure-[name].bundle.min.js',
		'output-path': path.join( __dirname, '../_inc/build/instant-search' ),
	}
);

module.exports = {
	...baseWebpackConfig,
	resolve: {
		...baseWebpackConfig.resolve,
		modules: [
			// Allow importing from instant search path
			path.resolve( __dirname, '../node_modules' ),
			'node_modules',
		],
	},
	devtool: isDevelopment ? 'source-map' : false,
	node: {
		fs: 'empty',
	},
	plugins: [
		...baseWebpackConfig.plugins,
		new DependencyExtractionWebpackPlugin( { injectPolyfill: true } ),
		definePaletteColorsAsStaticVariables(),
	],
};
