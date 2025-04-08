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
];
