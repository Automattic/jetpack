/**
 * External dependencies
 */
const getBaseWebpackConfig = require( '@automattic/calypso-build/webpack.config.js' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const path = require( 'path' );

const isDevelopment = process.env.NODE_ENV !== 'production';

const baseConfig = getBaseWebpackConfig(
	{ WP: false },
	{
		entry: {}, // We'll override later
		'output-filename': '[name].js',
		'output-path': path.join( __dirname, './build' ),
	}
);

module.exports = [
	{
		...baseConfig,
		resolve: {
			...baseConfig.resolve,
			modules: [ 'node_modules' ],
		},
		devtool: isDevelopment ? 'source-map' : false,
		entry: { index: path.join( __dirname, './src/js/index.js' ) },
		plugins: [
			...baseConfig.plugins,
			new DependencyExtractionWebpackPlugin( { injectPolyfill: true } ),
		],
	},
];
