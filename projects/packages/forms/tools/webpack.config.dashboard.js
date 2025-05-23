/**
 * Builds the forms dashboard JS bundle.
 */

const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = {
	mode: jetpackWebpackConfig.mode,
	entry: {
		'jetpack-forms-dashboard': path.join( __dirname, '..', 'src/dashboard/index.tsx' ),
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '..', 'dist/dashboard' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
		modules: [ 'node_modules' ],
		alias: {
			...jetpackWebpackConfig.resolve.alias,
			fs: false,
		},
	},
	externals: {
		...jetpackWebpackConfig.externals,
		jetpackConfig: JSON.stringify( {
			consumer_slug: 'jetpack-forms',
		} ),
	},
	module: {
		rules: [
			// Transpile JavaScript
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),

			// Transpile @automattic/* in node_modules too.
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@automattic/', 'debug/' ],
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
								textdomain: 'jetpack-forms',
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
								},
							},
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
	plugins: [ ...jetpackWebpackConfig.StandardPlugins() ],
};
