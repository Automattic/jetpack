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

				// Add textdomains (but no other optimizations) for @automattic/dataviews.
				jetpackWebpackConfig.TranspileRule( {
					includeNodeModules: [ '@automattic/dataviews/' ],
					babelOpts: {
						configFile: false,
						plugins: [
							[
								require.resolve( '@automattic/babel-plugin-replace-textdomain' ),
								{ textdomain: 'jetpack-protect' },
							],
						],
					},
				} ),

				// Also set .resolve.fullySpecified = false for @automattic/dataviews.
				{
					test: /\/@automattic\/dataviews\//,
					resolve: {
						fullySpecified: false,
					},
				},

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
