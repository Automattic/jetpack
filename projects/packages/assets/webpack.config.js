const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

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
		/*
		 * This bundle pulls in @automattic/jetpack-api -> @automattic/jetpack-config, whose
		 * `require( 'jetpackConfig' )` needs a value or it logs "jetpackConfig is missing". The
		 * shared bundle serves every plugin, so it can't bake in a single consumer_slug; useConnection
		 * passes the consuming bundle's slug to registerSite instead.
		 */
		externals: {
			jetpackConfig: JSON.stringify( {} ),
		},
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
		 * babel.config.js rewrites its strings to the jetpack-assets textdomain.
		 */
		module: {
			strictExportPresence: true,
			rules: [
				jetpackWebpackConfig.TranspileRule(),
				jetpackWebpackConfig.TranspileRule( {
					includeNodeModules: [ '@automattic/jetpack-' ],
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
