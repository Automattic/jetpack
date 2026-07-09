const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );

// Configuration shared by every build in this package.
const baseConfig = {
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
			consumer_slug: 'jetpack-videopress',
		} ),
	},
};

module.exports = [
	{
		...baseConfig,
		entry: {
			// Video block
			'block-editor/blocks/video/index': './src/client/block-editor/blocks/video/index.ts',
			'block-editor/blocks/video/view': './src/client/block-editor/blocks/video/view.ts',

			'lib/token-bridge': './src/client/lib/token-bridge/index.ts',
			'lib/player-bridge': './src/client/lib/player-bridge/index.ts',

			// VideoPress dashboard page
			'admin/index': './src/client/admin/index.js',

			// Page-level shell stylesheet for the modernized dashboard. CSS-only
			// entry: emits build/dashboard-shell/index.css enqueued by
			// class-admin-ui.php so every route inherits the admin-page-layout
			// mixin (fixed #wpbody-content, scrollable middle, pinned footer)
			// without each route having to invoke it itself.
			'dashboard-shell/index': './src/dashboard/admin-shell.scss',

			// Block editor extensions
			'block-editor/index': './src/client/block-editor/index.ts',
			// Divi editor extensions
			'divi-editor/index': './src/client/divi-editor/index.js',
		},
		plugins: [
			...jetpackWebpackConfig.StandardPlugins(),
			new CopyWebpackPlugin( {
				patterns: [
					{
						context: 'src/client/block-editor/blocks',
						from: './*/block.json',
						to: './block-editor/blocks/[path]/[name].json',
					},
					{
						from: 'src/client/block-editor/extensions/index.json',
						to: './block-editor/extensions/index.json',
					},
				],
			} ),
		],
	},

	// The Divi 5 Visual Builder module ships as a Divi extension, so it must bind
	// to the `@wordpress/*` instances Divi vendors (`window.vendor.wp.*`) rather
	// than the standard WordPress globals, which aren't reliably loaded in the
	// builder. In particular Divi fires its module-registration action on its own
	// `@wordpress/hooks` instance, so externalizing `@wordpress/hooks` there is
	// what lets our `registerModule()` callback run.
	{
		...baseConfig,
		entry: {
			'divi-5/index': './src/client/divi-5/index.js',
		},
		plugins: [
			...jetpackWebpackConfig.StandardPlugins( {
				DependencyExtractionPlugin: {
					requestMap: {
						'@wordpress/hooks': {
							external: [ 'vendor', 'wp', 'hooks' ],
							handle: 'divi-vendor-wp-hooks',
						},
						'@wordpress/i18n': {
							external: [ 'vendor', 'wp', 'i18n' ],
							handle: 'divi-vendor-wp-i18n',
						},
					},
				},
			} ),
			new CopyWebpackPlugin( {
				patterns: [
					/*
					 * Divi 5 module metadata read by PHP at runtime (module
					 * registration and the Divi 5 Migrator). Copied into build/
					 * because src/client is production-excluded from the package.
					 */
					{
						context: 'src/client/divi-5/modules',
						from: './*/module.json',
						to: './divi-5/modules/[path]/[name].json',
					},
					{
						context: 'src/client/divi-5/modules',
						from: './*/conversion-outline.json',
						to: './divi-5/modules/[path]/[name].json',
					},
				],
			} ),
		],
	},
];
