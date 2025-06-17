const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = [
	{
		entry: {
			index: './_inc/admin.jsx',
		},
		mode: jetpackWebpackConfig.mode,
		devtool: jetpackWebpackConfig.devtool,
		output: {
			...jetpackWebpackConfig.output,
			path: path.resolve( './build' ),
		},
		optimization: {
			...jetpackWebpackConfig.optimization,
		},
		resolve: {
			...jetpackWebpackConfig.resolve,
			alias: {
				...jetpackWebpackConfig.resolve.alias,
				'@automattic/calypso-config': '@automattic/calypso-config/src/client.js',
			},
			fallback: {
				...jetpackWebpackConfig.resolve.fallback,
				events: require.resolve( 'events/' ),
			},
		},
		node: false,
		plugins: [ ...jetpackWebpackConfig.StandardPlugins() ],
		module: {
			strictExportPresence: true,
			rules: [
				// Transpile JavaScript
				jetpackWebpackConfig.TranspileRule( {
					exclude: /node_modules\//,
				} ),

				// Transpile @automattic/* in node_modules too.
				jetpackWebpackConfig.TranspileRule( {
					includeNodeModules: [ '@automattic/' ],
				} ),

				// Add textdomains (but no other optimizations) for @wordpress/dataviews.
				jetpackWebpackConfig.TranspileRule( {
					includeNodeModules: [ '@wordpress/dataviews/' ],
					babelOpts: {
						configFile: false,
						plugins: [
							[
								require.resolve( '@automattic/babel-plugin-replace-textdomain' ),
								{ textdomain: 'jetpack-subscribers-dashboard' },
							],
						],
					},
				} ),

				// Add textdomains (but no other optimizations) for @wordpress/dataviews.
				jetpackWebpackConfig.TranspileRule( {
					includeNodeModules: [ '@wordpress/dataviews/build-wp/' ],
					babelOpts: {
						configFile: false,
						plugins: [
							[
								require.resolve( '@automattic/babel-plugin-replace-textdomain' ),
								{ textdomain: 'jetpack-subscribers-dashboard' },
							],
						],
					},
				} ),

				// Handle CSS.
				jetpackWebpackConfig.CssRule( {
					extensions: [ 'css', 'sass', 'scss' ],
					extraLoaders: [ { loader: 'sass-loader', options: { api: 'modern-compiler' } } ],
				} ),

				// Handle images.
				jetpackWebpackConfig.FileRule(),
			],
		},
		externals: {
			...jetpackWebpackConfig.externals,
			jetpackConfig: JSON.stringify( {
				consumer_slug: 'subscribers',
			} ),
		},
	},
];
