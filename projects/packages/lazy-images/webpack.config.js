/**
 * External dependencies
 */
const getBaseWebpackConfig = require( '@automattic/calypso-build/webpack.config.js' );
const path = require( 'path' );

const baseConfig = getBaseWebpackConfig(
	{ WP: false },
	{
		entry: {}, // We'll override later
		'output-filename': '[name].js',
		'output-path': path.join( __dirname, './dist' ),
	}
);

module.exports = [
	{
		...baseConfig,
		resolve: {
			...baseConfig.resolve,
			modules: [ 'node_modules' ],
		},
		entry: {
			'lazy-images': path.join( __dirname, './src/js/lazy-images.js' ),
			'intersection-observer': path.join(
				__dirname,
				'./node_modules/intersection-observer/intersection-observer.js'
			),
		},
	},
];
