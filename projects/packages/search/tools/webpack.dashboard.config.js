const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	entry: {
		'jp-search-dashboard': path.join( __dirname, '../src/dashboard/index.jsx' ),
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '../build/dashboard' ),
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
			'instant-search': path.join( __dirname, '../src/instant-search' ),
		},
		modules: [
			path.resolve( __dirname, '../src/dashboard' ),
			'node_modules',
			path.resolve( __dirname, '../node_modules' ), // For core-js
		],
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: {
				injectPolyfill: true,
				// Match Boost / Jetpack AI admin: @wordpress/ui pulls these in transitively;
				// they are not reliably registered as WP script handles in all contexts, so
				// bundle them together instead of externalizing. Both must be bundled jointly
				// so @wordpress/theme's module-init lock() lands on the same private-apis
				// consent map. See PR #48173.
				requestMap: {
					'@wordpress/theme': { external: false },
					'@wordpress/private-apis': { external: false },
				},
			},
		} ),
	],
	externals: {
		jetpackConfig: JSON.stringify( {
			consumer_slug: 'jetpack-search',
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
