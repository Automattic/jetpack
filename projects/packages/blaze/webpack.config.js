const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = [
	{
		devtool: jetpackWebpackConfig.devtool,
		entry: {
			editor: './src/js/editor.js',
		},
		externals: {
			...jetpackWebpackConfig.externals,
			jetpackConfig: JSON.stringify( {
				consumer_slug: 'jetpack-blaze',
			} ),
		},
		mode: jetpackWebpackConfig.mode,
		node: false,
		module: {
			strictExportPresence: true,
			rules: [
				// Gutenberg packages' ESM builds don't fully specify their imports. Sigh.
				// https://github.com/WordPress/gutenberg/issues/73362
				{
					test: /\/node_modules\/@wordpress\/.*\/build-module\/.*\.js$/,
					resolve: { fullySpecified: false },
				},

				// Transpile JavaScript.
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
		output: {
			...jetpackWebpackConfig.output,
			path: path.join( __dirname, './build' ),
		},
		optimization: {
			...jetpackWebpackConfig.optimization,
		},
		plugins: [ ...jetpackWebpackConfig.StandardPlugins() ],
		resolve: {
			...jetpackWebpackConfig.resolve,
		},
	},
];
