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
			alias: {
				'@automattic/jetpack-connection': path.resolve( __dirname, '../../rna/connection' ),
				'@automattic/jetpack-components': path.resolve( __dirname, '../../rna/components' ),
			},
		},
		devtool: isDevelopment ? 'source-map' : false,
		entry: { index: path.join( __dirname, './_inc/admin.jsx' ) },
		plugins: [
			...baseConfig.plugins,
			new DependencyExtractionWebpackPlugin( { injectPolyfill: true } ),
		],
	},
];
