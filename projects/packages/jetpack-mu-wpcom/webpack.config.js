// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require( 'path' );
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jetpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const verbumConfig = require( './verbum.webpack.config.js' );

module.exports = [
	...verbumConfig,
	{
		entry: {
			'block-theme-previews': './src/features/block-theme-previews/index.js',
			'core-customizer-css':
				'./src/features/custom-css/custom-css/js/core-customizer-css.core-4.9.js',
			'core-customizer-css-preview':
				'./src/features/custom-css/custom-css/js/core-customizer-css-preview.js',
			'customizer-control': './src/features/custom-css/custom-css/css/customizer-control.css',
			'error-reporting': './src/features/error-reporting/index.js',
			'jetpack-global-styles': './src/features/jetpack-global-styles/index.js',
			'jetpack-global-styles-customizer-fonts':
				'./src/features/jetpack-global-styles/customizer-fonts/index.js',
			'override-preview-button-url':
				'./src/features/override-preview-button-url/override-preview-button-url.js',
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
