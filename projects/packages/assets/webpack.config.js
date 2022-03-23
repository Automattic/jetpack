const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const path = require( 'path' );

module.exports = [
	{
		entry: {
			'i18n-loader': {
				import: './src/js/i18n-loader.js',
				library: {
					name: [ 'wp', 'jpI18nLoader' ],
					type: 'window',
				},
			},
		},
		mode: jetpackWebpackConfig.mode,
		devtool: jetpackWebpackConfig.isProduction ? false : 'source-map',
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
	},
];
