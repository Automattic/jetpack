/**
 * External dependencies
 */
const getBaseWebpackConfig = require( '@automattic/calypso-build/webpack.config.js' );
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
			path: path.join( __dirname, '_inc/build/instant-search' ),
			filename: 'jp-search.bundle.js',
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
	},
];
