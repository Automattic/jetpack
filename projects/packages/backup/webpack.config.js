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
				consumer_slug: 'jetpack-backup',
			} ),
		},
	},
];
