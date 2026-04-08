/**
 *WARNING: No ES6 modules here. Not transpiled! ****
 *
 * Webpack config for the Jetpack AI Agents Manager provider module.
 *
 * Produces the provider bundle in _inc/blocks/ai-sidebar/:
 * jetpack-ai-provider.js: Provider module for Agents Manager
 * (IIFE that assigns exports to window.__JetpackAIProvider)
 * jetpack-ai-provider-esm.mjs: ESM wrapper for dynamic import
 */
const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const CopyPlugin = require( 'copy-webpack-plugin' );

module.exports = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '../_inc/blocks/ai-sidebar' ),
		library: {
			name: '__JetpackAIProvider',
			type: 'window',
		},
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
	},
	node: {},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			MiniCssExtractPlugin: {},
			// Disable i18n checker — agenttic-ui has minified _n() calls
			// that trigger false positives.
			I18nCheckPlugin: false,
		} ),
		// Copy the ESM wrapper alongside the IIFE bundle.
		new CopyPlugin( {
			patterns: [
				{
					from: path.resolve(
						__dirname,
						'../extensions/plugins/ai-assistant-plugin/ai-sidebar/jetpack-ai-provider-esm.mjs'
					),
					to: path.join( __dirname, '../_inc/blocks/ai-sidebar/jetpack-ai-provider-esm.mjs' ),
				},
			],
		} ),
	],
	externals: {
		...jetpackWebpackConfig.externals,
	},
	entry: {
		'jetpack-ai-provider': path.resolve(
			__dirname,
			'../extensions/plugins/ai-assistant-plugin/ai-sidebar/jetpack-ai-provider.ts'
		),
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
				includeNodeModules: [ '@automattic/' ],
			} ),

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
};
