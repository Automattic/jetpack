const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );

// Service-walkthrough illustrations referenced by
// `_inc/components/services/utils.tsx` via runtime URLs (so the chassis esbuild
// pipeline, which doesn't configure a binary loader, can consume them too). Copy
// them verbatim into the shared `build/assets/` directory; both bundlers resolve
// via `JetpackScriptData.social.assets_url + 'assets/<file>'`.
const copyAssetsPlugin = new CopyWebpackPlugin( {
	patterns: [
		{
			from: path.resolve( __dirname, '_inc/assets' ),
			to: 'assets',
		},
	],
} );

// Standard plugin set, optionally overriding dependency extraction.
const standardPlugins = ( extractionOptions = {} ) => [
	...jetpackWebpackConfig.StandardPlugins( extractionOptions ),
	copyAssetsPlugin,
];

const socialWebpackConfig = {
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

			// Workarounds for non-extracted `@wordpress/*` packages.
			...jetpackWebpackConfig.BundledWpPkgsTranspileRules(),

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
					{ loader: 'sass-loader', options: { api: 'modern-compiler' } },
				],
			} ),

			// Handle images.
			jetpackWebpackConfig.FileRule(),
		],
	},
	externals: {
		...jetpackWebpackConfig.externals,
		jetpackConfig: JSON.stringify( {
			consumer_slug: 'jetpack-social',
		} ),
	},
};

module.exports = [
	{
		...socialWebpackConfig,
		// Editor and classic-editor bundles: keep @wordpress/theme and
		// @wordpress/private-apis EXTERNAL. These load inside the block editor and must
		// share WordPress's canonical private-apis instance; bundling a copy inline
		// breaks lock()/unlock() across bundles ("Cannot unlock an object that was not
		// locked before"). On WP 6.9.x the wp-theme handle is absent, so these stay
		// unenqueued there (unchanged from before); on newer WP they enqueue normally.
		plugins: standardPlugins(),
		entry: {
			'classic-editor': './_inc/entry-points/classic-editor.js',
			'block-editor-jetpack': './_inc/entry-points/block-editor-jetpack.tsx',
			'block-editor-social': './_inc/entry-points/block-editor-social.tsx',
		},
		devServer: jetpackWebpackConfig.DevServer( {
			static: { directory: path.resolve( './build' ) },
		} ),
	},
	{
		...socialWebpackConfig,
		// Standalone Social admin page: bundle @wordpress/theme and
		// @wordpress/private-apis inline so the page renders on WP 6.9.x, whose wp-theme
		// script handle is missing (externalizing it makes the bundle silently fail to
		// enqueue). Safe here because this is a standalone admin page, not the block
		// editor, so there is no shared canonical private-apis instance to conflict with.
		// Both are bundled jointly so @wordpress/theme's module-init lock() lands on the
		// same private-apis consent map. See PR #48173.
		plugins: standardPlugins( {
			DependencyExtractionPlugin: {
				requestMap: {
					'@wordpress/theme': { external: false },
					'@wordpress/private-apis': { external: false },
				},
			},
		} ),
		entry: {
			'social-admin-page': './_inc/entry-points/social-admin-page.tsx',
		},
		devServer: jetpackWebpackConfig.DevServer( {
			static: { directory: path.resolve( './build' ) },
		} ),
	},
];
