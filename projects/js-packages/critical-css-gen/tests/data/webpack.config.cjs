const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const webpack = require( 'webpack' );

module.exports = {
	entry: path.join( __dirname, '../../src/browser.ts' ),
	mode: 'development',
	devtool: false,
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '../build' ),
		filename: 'bundle.js',
		library: 'CriticalCSSGenerator',
		uniqueName: 'CriticalCSSGenerator',
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
		// These are needed for the build to work,
		// otherwise it errors out because of the clean-css dependency.
		fallback: {
			...jetpackWebpackConfig.resolve.fallback,
			path: require.resolve( 'path-browserify' ),
			process: require.resolve( 'process/browser' ),
			url: false,
			https: false,
			http: false,
			fs: false,
			os: false,
		},
	},
	node: false,
	plugins: [
		new webpack.ProvidePlugin( {
			process: require.resolve( 'process/browser' ),
		} ),
	],
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
		],
	},
};
