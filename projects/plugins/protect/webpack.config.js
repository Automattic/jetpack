const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = [
	{
		entry: {
			index: './src/js/index.tsx',
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

				// Transpile @automattic/jetpack-* in node_modules too.
				jetpackWebpackConfig.TranspileRule( {
					includeNodeModules: [ '@automattic/jetpack-' ],
				} ),

				/**
				 * Transpile @wordpress/dataviews in node_modules too.
				 *
				 * @see https://github.com/Automattic/jetpack/issues/39907
				 */
				jetpackWebpackConfig.TranspileRule( {
					includeNodeModules: [ '@wordpress/dataviews/build-wp/' ],
					babelOpts: {
						configFile: false,
						plugins: [
							[
								require.resolve( '@automattic/babel-plugin-replace-textdomain' ),
								{
									textdomain: 'jetpack-protect',
									functions: {
										__: 1,
										__1: 1,
										__2: 1,
										__3: 1,
										__4: 1,
										__5: 1,
										__6: 1,
										__7: 1,
										__8: 1,
										__9: 1,
										__10: 1,
										__11: 1,
										__12: 1,
										__13: 1,
										__14: 1,
										__15: 1,
										__16: 1,
										__17: 1,
										__18: 1,
										__19: 1,
										__20: 1,
										__21: 1,
										__22: 1,
										__23: 1,
										__24: 1,
										__25: 1,
										__26: 1,
										__27: 1,
										__28: 1,
										__29: 1,
										__30: 1,
										_x: 2,
										_x1: 2,
										_x2: 2,
										_x3: 2,
										_x4: 2,
										_x5: 2,
										_n: 3,
										_nx: 4,
									},
								},
							],
						],
					},
				} ),

				// Handle CSS.
				jetpackWebpackConfig.CssRule( {
					extensions: [ 'css', 'sass', 'scss' ],
					extraLoaders: [ 'sass-loader' ],
				} ),

				// Handle images.
				jetpackWebpackConfig.FileRule(),
			],
		},
		externals: {
			...jetpackWebpackConfig.externals,
			jetpackConfig: JSON.stringify( {
				consumer_slug: 'jetpack-protect',
			} ),
		},
	},
];
