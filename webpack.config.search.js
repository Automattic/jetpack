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
		entry: {}, // We'll override later
		'output-filename': '[name].js',
		'output-path': path.join( __dirname, '_inc', 'build' ),
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

module.exports = [
	{
		...sharedWebpackConfig,
		entry: { search: path.join( __dirname, './modules/search/instant-search/index.jsx' ) },
		output: {
			...sharedWebpackConfig.output,
			chunkFilename: 'jp-search.chunk-[name]-[hash].js',
			filename: 'jp-search.bundle.js',
			path: path.join( __dirname, '_inc/build/instant-search' ),
		},
		performance: isDevelopment
			? {
					maxAssetSize: 500000,
					maxEntrypointSize: 500000,
					hints: 'error',
			  }
			: {
					maxAssetSize: 153600,
					maxEntrypointSize: 153600,
					hints: 'error',
			  },
		plugins: [
			...sharedWebpackConfig.plugins,
			new DependencyExtractionWebpackPlugin( { injectPolyfill: true } ),
		],
	},
];
