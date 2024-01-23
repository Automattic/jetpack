// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require( 'path' );
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jetpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const CopyPlugin = require( 'copy-webpack-plugin' );
const webpack = require( 'webpack' );

const babelOpts = {
	plugins: [
		[
			'@babel/plugin-transform-react-jsx',
			{
				pragma: 'h',
				pragmaFrag: 'Fragment',
			},
		],
	],
	presets: [ [ '@automattic/jetpack-webpack-config/babel/preset' ] ],
};

module.exports = {
	entry: {
		'verbum-comments': './src/features/verbum-comments/src/index.tsx',
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
			DependencyExtractionPlugin: { injectPolyfill: false },
			MiniCssExtractPlugin: { filename: '[name]/[name].css' },
		} ),
		new webpack.ProvidePlugin( {
			h: [ 'preact', 'h' ],
			Fragment: [ 'preact', 'Fragment' ],
		} ),
		new CopyPlugin( {
			patterns: [
				{
					from: './src/features/verbum-comments/class-verbum-comments.php',
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
				babelOpts,
			} ),

			// Transpile @automattic/jetpack-* in node_modules too.
			jetpackConfig.TranspileRule( {
				includeNodeModules: [ '@automattic/jetpack-' ],
			} ),

			// preact has some `__` internal methods, which confuse i18n-check-webpack-plugin. Hack around that.
			jetpackConfig.TranspileRule( {
				includeNodeModules: [ 'preact' ],
				babelOpts: {
					configFile: false,
					plugins: [ [ 'babel-plugin-transform-rename-properties', { rename: { __: '__ǃ' } } ] ],
					presets: [],
				},
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
