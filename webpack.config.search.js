/**
 * External dependencies
 */
const getBaseWebpackConfig = require( '@automattic/calypso-build/webpack.config.js' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const path = require( 'path' );

const isDevelopment = process.env.NODE_ENV !== 'production';

const baseWebpackConfig = getBaseWebpackConfig(
	{ WP: false },
	{
		entry: { search: path.join( __dirname, './modules/search/instant-search/index.jsx' ) },
		'output-chunk-filename': 'jp-search.chunk-[name]-[hash].js',
		'output-filename': 'jp-search.bundle.js',
		'output-path': path.join( __dirname, '_inc', 'build', 'instant-search' ),
	}
);

const sharedWebpackConfig = {
	...baseWebpackConfig,
	resolve: {
		...baseWebpackConfig.resolve,
		modules: [ path.resolve( __dirname, '_inc/client' ), 'node_modules' ],
	},
	node: {
		fs: 'empty',
		process: true,
	},
	devtool: isDevelopment ? 'source-map' : false,
};

module.exports = {
	...sharedWebpackConfig,

	performance: isDevelopment
		? false
		: {
				maxAssetSize: 153600,
				maxEntrypointSize: 153600,
				hints: 'error',
		  },
	plugins: [
		...sharedWebpackConfig.plugins,
		new DependencyExtractionWebpackPlugin( { injectPolyfill: true } ),
	],
};
