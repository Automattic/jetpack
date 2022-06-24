const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const { definePaletteColorsAsStaticVariables } = require( './webpack.helpers' );

module.exports = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.isDevelopment ? 'source-map' : false,
	entry: {
		index: {
			import: path.join( __dirname, '../modules/widget-visibility/editor/index.jsx' ),
			library: {
				name: 'WidgetVisibility',
				type: 'window',
				export: 'WidgetVisibility',
			},
		},
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '../_inc/build/widget-visibility/editor' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
		modules: [ path.resolve( __dirname, '../_inc/client' ), 'node_modules' ],
		fallback: {
			...jetpackWebpackConfig.resolve.fallback,
			fs: false,
		},
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: { injectPolyfill: true },
			I18nLoaderPlugin: { textdomain: 'jetpack' },
		} ),
		definePaletteColorsAsStaticVariables(),
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
				includeNodeModules: [ '@automattic/jetpack-', 'debug/' ],
			} ),

			// Handle CSS.
			jetpackWebpackConfig.CssRule( {
				extensions: [ 'css', 'sass', 'scss' ],
				extraLoaders: [
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: { config: path.join( __dirname, 'postcss.config.js' ) },
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
