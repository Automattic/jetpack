// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require( 'path' );
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jetpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const CopyPlugin = require( 'copy-webpack-plugin' );
const webpack = require( 'webpack' );

module.exports = {
	entry: {
		'error-reporting': './src/features/error-reporting/index.js',
		'verbum-comments': './src/features/verbum-comments/src/index.tsx',
		'block-theme-previews': './src/features/block-theme-previews/index.js',
	},
	mode: jetpackConfig.mode,
	devtool: jetpackConfig.devtool,
	output: {
		...jetpackConfig.output,
		filename: '[name]/[name].js',
		path: path.resolve( __dirname, 'src/build' ),
		environment: {
			module: true,
			dynamicImport: true,
		},
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
			DependencyExtractionPlugin: { injectPolyfill: true },
			MiniCssExtractPlugin: { filename: '[name]/[name].css' },
		} ),
		new webpack.ProvidePlugin( {
			h: [ 'preact', 'h' ],
			Fragment: [ 'preact', 'Fragment' ],
		} ),
		new CopyPlugin( {
			patterns: [
				{
					from: './src/features/verbum-comments/index.php',
					to: './verbum-comments',
				},
				{
					from: './src/features/verbum-comments/assets',
					to: './verbum-comments/assets',
				},
			],
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
};
