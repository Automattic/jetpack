const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	entry: {
		'jp-search-inline': path.join( __dirname, '../src/inline-search/js/index.js' ),
		'corrected-query': path.join( __dirname, '../src/inline-search/styles/corrected-query.scss' ),
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '../build/inline-search' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
		modules: [
			path.resolve( __dirname, '../src/inline-search' ),
			'node_modules',
			path.resolve( __dirname, '../node_modules' ),
		],
	},
	plugins: [ ...jetpackWebpackConfig.StandardPlugins() ],
	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript except node modules.
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
				extraLoaders: [
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: { config: path.join( __dirname, '../postcss.config.js' ) },
						},
					},
					'sass-loader',
				],
			} ),

			// Handle images.
			jetpackWebpackConfig.FileRule(),
		],
	},
};
