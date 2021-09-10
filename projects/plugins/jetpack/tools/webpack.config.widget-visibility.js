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
	{ WP: true },
	{
		entry: {
			main: path.join( __dirname, '../modules/widget-visibility/editor/index.jsx' ),
		},
		'output-filename': 'index.min.js',
		'output-path': path.join( __dirname, '../_inc/build/widget-visibility/editor' ),
	}
);

module.exports = {
	...baseWebpackConfig,
	resolve: {
		...baseWebpackConfig.resolve,
		modules: [
			path.resolve( __dirname, '../_inc/client' ),
			path.resolve( __dirname, '../node_modules' ),
			'node_modules',
		],
		fallback: {
			fs: false,
		},
	},
	devtool: isDevelopment ? 'source-map' : false,
	plugins: [
		...baseWebpackConfig.plugins,
		new DependencyExtractionWebpackPlugin( { injectPolyfill: true } ),
		definePaletteColorsAsStaticVariables(),
	],
};
