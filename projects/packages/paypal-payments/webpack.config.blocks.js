/**
 *WARNING: No ES6 modules here. Not transpiled! ****
 */

const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );

/**
 * Internal variables
 */
const sharedWebpackConfig = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	entry: {
		'block/editor': './src/block/editor.js',
		'legacy-simple-payments': './src/legacy/simple-payments.css',
		'paypal-payment-buttons/editor': './src/paypal-payment-buttons/editor.js',
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, './dist' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
	},
	node: {},
	plugins: [ ...jetpackWebpackConfig.StandardPlugins() ],
	externals: {
		...jetpackWebpackConfig.externals,
		jetpackConfig: JSON.stringify( {
			consumer_slug: 'jetpack-paypal-payments',
		} ),
	},
	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),

			// Transpile @automattic/* in node_modules too.
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [
					'@automattic/',
					'debug/',
					'gridicons/',
					'punycode/',
					'query-string/',
					'split-on-first/',
					'strict-uri-encode/',
				],
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
							postcssOptions: { plugins: [ require( 'autoprefixer' ) ] },
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

module.exports = [
	{
		...sharedWebpackConfig,
		plugins: [
			...sharedWebpackConfig.plugins,
			new CopyWebpackPlugin( {
				patterns: [
					{
						from: 'src/block/**/block.json',
						to: 'block/[name][ext]',
						noErrorOnMissing: true,
					},
					{
						from: 'src/paypal-payment-buttons/block.json',
						to: 'paypal-payment-buttons/[name][ext]',
						noErrorOnMissing: true,
					},
				],
			} ),
		],
	},
];
