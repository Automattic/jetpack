const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );

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
	plugins: [
		...jetpackWebpackConfig.StandardPlugins(),
		// Service-walkthrough illustrations referenced by
		// `_inc/components/services/utils.tsx` via runtime URLs (so the
		// chassis esbuild pipeline, which doesn't configure a binary
		// loader, can consume them too). Copy them verbatim into the
		// shared `build/assets/` directory; both bundlers resolve via
		// `JetpackScriptData.social.assets_url + 'assets/<file>'`.
		new CopyWebpackPlugin( {
			patterns: [
				{
					from: path.resolve( __dirname, '_inc/assets' ),
					to: 'assets',
				},
			],
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
		entry: {
			'classic-editor': './_inc/entry-points/classic-editor.js',
		},
	},
	{
		...socialWebpackConfig,
		entry: {
			'social-admin-page': './_inc/entry-points/social-admin-page.tsx',
			'block-editor-jetpack': './_inc/entry-points/block-editor-jetpack.tsx',
			'block-editor-social': './_inc/entry-points/block-editor-social.tsx',
		},
		devServer: jetpackWebpackConfig.DevServer( {
			static: { directory: path.resolve( './build' ) },
		} ),
	},
];
