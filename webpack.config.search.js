/**
 * External dependencies
 */
const getBaseWebpackConfig = require( '@automattic/calypso-build/webpack.config.js' );
const path = require( 'path' );

const isDevelopment = process.env.NODE_ENV !== 'production';

const baseWebpackConfig = getBaseWebpackConfig(
	{ WP: false },
	{
		entry: {
			main: path.join( __dirname, './modules/search/instant-search/index.jsx' ),
			customize: path.join( __dirname, './modules/search/instant-search/index-customize.jsx' ),
		},
		'output-filename': 'jp-search-[name].js',
		'output-path': path.join( __dirname, '_inc/build/instant-search' ),
	}
);

module.exports = [
	{
		...baseWebpackConfig,
		devtool: isDevelopment ? 'source-map' : false,
		node: {
			fs: 'empty',
			process: true,
		},
		performance: isDevelopment
			? {
					maxAssetSize: 500000,
					maxEntrypointSize: 500000,
					hints: 'error',
			  }
			: {
					maxAssetSize: 122880,
					maxEntrypointSize: 122880,
					hints: 'error',
			  },
		resolve: {
			...baseWebpackConfig.resolve,
			modules: [ path.resolve( __dirname, '_inc/client' ), 'node_modules' ],
		},
	},
];
