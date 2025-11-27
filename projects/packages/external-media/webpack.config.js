const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = [
	{
		entry: {
			'jetpack-external-media-editor': './src/features/editor/index.js',
			'jetpack-external-media-import-button': [
				'./src/features/admin/external-media-import-button.js',
				'./src/features/admin/external-media-import-button.scss',
			],
			'jetpack-external-media-import-page': './src/features/admin/external-media-import.js',
		},
		mode: jetpackWebpackConfig.mode,
		devtool: jetpackWebpackConfig.devtool,
		output: {
			...jetpackWebpackConfig.output,
			filename: '[name]/[name].js',
			path: path.resolve( __dirname, 'src/build' ),
		},
		optimization: {
			...jetpackWebpackConfig.optimization,
		},
		resolve: {
			...jetpackWebpackConfig.resolve,
		},
		node: false,
		plugins: [
			...jetpackWebpackConfig.StandardPlugins( {
				MiniCssExtractPlugin: { filename: '[name]/[name].css' },
			} ),
		],
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
					extensions: [ 'css', 'scss' ],
					extraLoaders: [ { loader: 'sass-loader', options: { api: 'modern-compiler' } } ],
				} ),

				// Handle images.
				jetpackWebpackConfig.FileRule(),
			],
		},
		externals: {
			...jetpackWebpackConfig.externals,
			jetpackConfig: JSON.stringify( {
				consumer_slug: 'jetpack-external-media',
			} ),
		},
	},
];
