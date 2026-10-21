const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = [
	{
		devtool: jetpackWebpackConfig.devtool,
		entry: {
			'admin-bar': './src/js/admin-bar/index.jsx',
		},
		externals: {
			...jetpackWebpackConfig.externals,
		},
		mode: jetpackWebpackConfig.mode,
		node: false,
		module: {
			strictExportPresence: true,
			rules: [
				jetpackWebpackConfig.TranspileRule( {
					exclude: /node_modules\//,
				} ),
				jetpackWebpackConfig.TranspileRule( {
					includeNodeModules: [ '@automattic/' ],
				} ),
				...jetpackWebpackConfig.BundledWpPkgsTranspileRules(),
				jetpackWebpackConfig.CssRule( {
					extensions: [ 'css', 'sass', 'scss' ],
					extraLoaders: [ { loader: 'sass-loader', options: { api: 'modern-compiler' } } ],
				} ),
				jetpackWebpackConfig.FileRule(),
			],
		},
		output: {
			...jetpackWebpackConfig.output,
			path: path.join( __dirname, './build' ),
		},
		optimization: {
			...jetpackWebpackConfig.optimization,
		},
		plugins: [
			...jetpackWebpackConfig.StandardPlugins( {
				DependencyExtractionPlugin: { bundleWpUiDeps: true },
			} ),
		],
		resolve: {
			...jetpackWebpackConfig.resolve,
		},
	},
];
