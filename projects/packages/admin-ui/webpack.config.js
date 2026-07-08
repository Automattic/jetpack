const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = {
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
