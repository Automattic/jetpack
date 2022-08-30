const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = {
	entry: { 'action-bar': path.join( __dirname, './src/action-bar.jsx' ) },
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, './build' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
		splitChunks: {
			// Unused keys are prefixed with underscores, as per eslint recommendation.
			name: ( _module, _chunks, key ) => `action-bar.${ key }`,
		},
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
		alias: {
			...jetpackWebpackConfig.resolve.alias,
		},
	},
	node: false,
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			I18nLoaderPlugin: { textdomain: 'jetpack-action-bar' },
		} ),
	],
	module: {
		strictExportPresence: true,
		rules: [
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
				// extraLoaders: [
				// 	{
				// 		loader: 'postcss-loader',
				// 		options: {
				// 			postcssOptions: { config: path.join( __dirname, '../postcss.config.js' ) },
				// 		},
				// 	},
				// 	'sass-loader',
				// ],
			} ),

			// Handle images.
			jetpackWebpackConfig.FileRule(),
		],
	},
};
