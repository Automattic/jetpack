/**
 * External dependencies
 */
const getBaseWebpackConfig = require( '@automattic/calypso-build/webpack.config.js' );
const path = require( 'path' );
const StaticSiteGeneratorPlugin = require( 'static-site-generator-webpack-plugin' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

const isDevelopment = process.env.NODE_ENV !== 'production';

const baseConfigs = {
	connection: getBaseWebpackConfig(
		{ WP: false },
		{
			entry: {}, // We'll override later
			'output-filename': '[name].js',
			'output-path': path.join( __dirname, './packages/connection-ui/build' ),
		}
	),
};

module.exports = [
	{
		mode: 'production',
		context: path.resolve( __dirname, 'packages/lazy-images/src/js' ),
		entry: './lazy-images.js',
		output: {
			path: path.resolve( __dirname, 'packages/lazy-images/src/js' ),
			filename: 'lazy-images.min.js',
		},
	},
	{
		mode: 'production',
		context: path.resolve( __dirname, 'packages/lazy-images/src/js' ),
		entry: './intersectionobserver-polyfill.js',
		output: {
			path: path.resolve( __dirname, 'packages/lazy-images/src/js' ),
			filename: 'intersectionobserver-polyfill.min.js',
		},
	},
	{
		...baseConfigs.connection,
		resolve: {
			...baseConfigs.connection.resolve,
			modules: [ path.resolve( __dirname, '_inc/client' ), 'node_modules' ],
		},
		node: {
			fs: 'empty',
			process: true,
		},
		devtool: isDevelopment ? 'source-map' : false,
		entry: { index: path.join( __dirname, './packages/connection-ui/_inc/admin.js' ) },
		plugins: [
			...baseConfigs.connection.plugins,
			new DependencyExtractionWebpackPlugin( { injectPolyfill: true } ),
		],
	},
];
