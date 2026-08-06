const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	entry: {
		'jp-stats-pricing-grid': path.join( __dirname, '../src/pricing-grid/index.jsx' ),
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '../build/pricing-grid' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
		splitChunks: {
			cacheGroups: {
				vendors: false,
			},
		},
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
		alias: {
			...jetpackWebpackConfig.resolve.alias,
			fs: false,
		},
		modules: [
			path.resolve( __dirname, '../src/pricing-grid' ),
			'node_modules',
			path.resolve( __dirname, '../node_modules' ),
		],
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: {
				injectPolyfill: true,
				requestMap: {
					'@wordpress/theme': { external: false },
					'@wordpress/private-apis': { external: false },
				},
			},
		} ),
	],
	externals: {
		jetpackConfig: JSON.stringify( {
			consumer_slug: 'jetpack-stats-admin',
		} ),
	},
	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),

			//  Transpile @automattic/jetpack-* in node_modules too.
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@automattic/jetpack-' ],
			} ),

			// Workarounds for non-extracted `@wordpress/*` packages.
			...jetpackWebpackConfig.BundledWpPkgsTranspileRules(),

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
					{ loader: 'sass-loader', options: { api: 'modern-compiler' } },
				],
			} ),

			// Handle images.
			jetpackWebpackConfig.FileRule(),
		],
	},
};
