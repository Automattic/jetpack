const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

const adminUi = {
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
	entry: {
		'admin-ui-upgrade-menu-tracking': [ './src/admin-ui-upgrade-menu-tracking.js' ],
		'admin-ui-upgrade-menu': [ './src/admin-ui-upgrade-menu.scss' ],
		// Token-only stylesheet (`:root{--wpds-*}`) shipped from @wordpress/theme so every
		// Jetpack admin page has a runtime source for WPDS design tokens. See class-admin-menu.php.
		'design-tokens': [ './src/design-tokens.css' ],
		'instant-nav': [ './src/instant-nav.js' ],
	},
	plugins: [ ...jetpackWebpackConfig.StandardPlugins() ],
	module: {
		strictExportPresence: true,
		rules: [
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@automattic/jetpack-' ],
			} ),
			...jetpackWebpackConfig.BundledWpPkgsTranspileRules(),
			jetpackWebpackConfig.CssRule( {
				extensions: [ 'css', 'sass', 'scss' ],
				extraLoaders: [ { loader: 'sass-loader', options: { api: 'modern-compiler' } } ],
			} ),
			jetpackWebpackConfig.FileRule(),
		],
	},
};

// The admin shell client: one script module, so a page makes one request for it. See class-admin-shell.php.
const adminShell = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	entry: { 'admin-shell': './src/admin-shell/index.js' },
	output: {
		...jetpackWebpackConfig.output,
		path: path.resolve( './build' ),
		filename: '[name].js',
		library: { type: 'module' },
		module: true,
		chunkFormat: 'module',
	},
	experiments: { outputModule: true },
	optimization: {
		...jetpackWebpackConfig.optimization,
		concatenateModules: true,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
	},
	node: false,
	plugins: jetpackWebpackConfig.StandardPlugins( {
		DependencyExtractionPlugin: false,
		I18nCheckPlugin: false,
		I18nLoaderPlugin: false,
		I18nSafeMangleExportsPlugin: false,
		MiniCssExtractPlugin: false,
		MiniCssWithRtlPlugin: false,
		WebpackRtlPlugin: false,
	} ),
	module: {
		strictExportPresence: true,
		rules: [ jetpackWebpackConfig.TranspileRule( { exclude: /node_modules\// } ) ],
	},
};

module.exports = [ adminUi, adminShell ];
