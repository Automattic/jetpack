/**
 * External dependencies
 */
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

module.exports = [
	{
		...defaultConfig,
		// entry: {
		// 	index: './_inc/admin.jsx',
		// },
		// mode: jetpackWebpackConfig.mode,
		// devtool: jetpackWebpackConfig.isDevelopment ? 'source-map' : false,
		// output: {
		// 	...jetpackWebpackConfig.output,
		// 	path: path.resolve( './build' ),
		// },
		// optimization: {
		// 	...jetpackWebpackConfig.optimization,
		// },
		resolve: {
			extensions: [ '.js', '.jsx', '.ts', '.tsx', '...' ],
		},
		// node: false,
		// plugins: [
		// 	...jetpackWebpackConfig.StandardPlugins( {
		// 		DependencyExtractionPlugin: { injectPolyfill: true },
		// 	} ),
		// ],
		module: {
			...defaultConfig.module,
			// strictExportPresence: true,
			rules: [
				...defaultConfig.module.rules,
				// Transpile JavaScript
				// jetpackWebpackConfig.TranspileRule( {
				// 	exclude: /node_modules\//,
				// } ),

				// Transpile @automattic/jetpack-* in node_modules too.
				// jetpackWebpackConfig.TranspileRule( {
				// 	includeNodeModules: [ '@automattic/jetpack-' ],
				// } ),

				// Handle CSS.
				jetpackWebpackConfig.CssRule( {
					extensions: [ 'css', 'sass', 'scss' ],
					extraLoaders: [ 'sass-loader' ],
				} ),

				// Handle images.
				// jetpackWebpackConfig.FileRule(),
			],
		},
		externals: {
			...jetpackWebpackConfig.externals,
			jetpackConfig: JSON.stringify( {
				consumer_slug: 'my_jetpack',
			} ),
		},
	},
];
