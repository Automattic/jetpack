const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = [
	{
		entry: {
			index: './src/js/index.js',
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

				// Workarounds for non-extracted `@wordpress/*` packages.
				...jetpackWebpackConfig.BundledWpPkgsTranspileRules(),

				// `@automattic/ui` ships `__("Date calendar")` / etc.
				// inside `DateRangeCalendar` without a text-domain arg
				// — Jetpack's production i18n check plugin flags those
				// as errors in the bundle. Run the textdomain-replace
				// babel plugin over it, same recipe as the `@wordpress/*`
				// bundled packages above.
				jetpackWebpackConfig.TranspileRule( {
					includeNodeModules: [ '@automattic/ui/' ],
					babelOpts: {
						configFile: false,
						plugins: [
							[
								require.resolve( '@automattic/babel-plugin-replace-textdomain' ),
								{ textdomain: 'jetpack-activity-log' },
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
				consumer_slug: 'jetpack-activity-log',
			} ),
		},
	},
];
