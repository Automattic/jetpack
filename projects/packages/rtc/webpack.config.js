const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = {
	entry: {
		'rtc-providers': './src/js/providers/index.ts',
		'rtc-notices': './src/js/notices/index.tsx',
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
			// Transpile JavaScript and TypeScript.
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
		// Resolve @wordpress/sync to the global `wp.sync` provided by WordPress.
		'@wordpress/sync': 'wp.sync',
		// Resolve Yjs to the global `wp.sync.Y` to avoid two separate Yjs
		// instances, which breaks shared document types. See:
		// https://github.com/yjs/yjs/issues/438
		yjs: 'wp.sync.Y',
	},
};
