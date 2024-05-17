// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require( 'path' );
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jetpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const verbumConfig = require( './verbum.webpack.config.js' );

module.exports = [
	...verbumConfig,
	{
		entry: {
			'error-reporting': './src/features/error-reporting/index.js',
			'block-theme-previews': './src/features/block-theme-previews/index.js',
			'wpcom-site-menu': './src/features/wpcom-site-menu/wpcom-site-menu.scss',
		},
		mode: jetpackConfig.mode,
		devtool: jetpackConfig.devtool,
		output: {
			...jetpackConfig.output,
			filename: '[name]/[name].js',
			path: path.resolve( __dirname, 'src/build' ),
		},
		optimization: {
			...jetpackConfig.optimization,
		},
		resolve: {
			...jetpackConfig.resolve,
		},
		node: false,
		plugins: [
			...jetpackConfig.StandardPlugins( {
				MiniCssExtractPlugin: { filename: '[name]/[name].css' },
			} ),
		],
		module: {
			strictExportPresence: true,
			rules: [
				// Transpile JavaScript.
				jetpackConfig.TranspileRule( {
					exclude: /node_modules\//,
				} ),

				// Transpile @automattic/jetpack-* in node_modules too.
				jetpackConfig.TranspileRule( {
					includeNodeModules: [ '@automattic/jetpack-' ],
				} ),

				// Handle CSS.
				jetpackConfig.CssRule( {
					extensions: [ 'css', 'scss' ],
					extraLoaders: [ 'sass-loader' ],
				} ),

				// Handle images.
				jetpackConfig.FileRule(),
			],
		},
	},
];
