const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

// Babel options that rewrite every bundled string's textdomain to jetpack-assets
// (see the shared-stores entry below for why).
const sharedStoresBabelOpts = {
	presets: [
		[
			require.resolve( '@automattic/jetpack-webpack-config/babel/preset' ),
			{ pluginReplaceTextdomain: { textdomain: 'jetpack-assets' } },
		],
	],
};

const sharedConfig = {
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
	plugins: [ ...jetpackWebpackConfig.StandardPlugins() ],
	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript, including node_modules.
			jetpackWebpackConfig.TranspileRule(),
		],
	},
};

module.exports = [
	{
		...sharedConfig,
		entry: {
			'i18n-loader': {
				import: './src/js/i18n-loader.js',
				library: {
					name: [ 'wp', 'jpI18nLoader' ],
					type: 'window',
				},
			},
		},
	},
	{
		...sharedConfig,
		entry: {
			'jetpack-script-data': {
				import: './src/js/script-data.js',
				library: {
					name: 'JetpackScriptDataModule',
					type: 'umd',
				},
			},
		},
		plugins: [
			...jetpackWebpackConfig.StandardPlugins( {
				MiniCssExtractPlugin: { filename: '[name].css' },
				DependencyExtractionPlugin: {
					requestMap: {
						// We don't want to externalize this package, we rather want to bundle it.
						'@automattic/jetpack-script-data': {},
					},
				},
			} ),
		],
	},
	{
		...sharedConfig,
		entry: {
			'jetpack-shared-stores': {
				import: './src/js/shared-stores.js',
				library: {
					name: 'JetpackSharedStores',
					type: 'umd',
				},
			},
		},
		/*
		 * Transpile the bundled @automattic/jetpack-shared-stores source (it ships as
		 * untranspiled TS/JS), in addition to the default node_modules-excluding rule.
		 * Rewrite every bundled string's textdomain to jetpack-assets: this bundle is
		 * shipped by the assets package, so its strings translate through that domain
		 * (matching the I18nCheckPlugin/I18nLoaderPlugin defaults and the script handle's
		 * registered textdomain). Source keeps each package's own domain for linting.
		 */
		module: {
			strictExportPresence: true,
			rules: [
				jetpackWebpackConfig.TranspileRule( { babelOpts: sharedStoresBabelOpts } ),
				jetpackWebpackConfig.TranspileRule( {
					includeNodeModules: [ '@automattic/jetpack-' ],
					babelOpts: sharedStoresBabelOpts,
				} ),
			],
		},
		plugins: [
			...jetpackWebpackConfig.StandardPlugins( {
				DependencyExtractionPlugin: {
					requestMap: {
						// We don't want to externalize this package (and its
						// /connection subpath), we rather want to bundle it.
						'@automattic/jetpack-shared-stores': {},
						'@automattic/jetpack-shared-stores/connection': {},
					},
				},
			} ),
		],
	},
];
