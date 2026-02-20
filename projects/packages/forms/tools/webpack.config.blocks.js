/**
 * Webpack config for blocks
 */

import path from 'path';
import { fileURLToPath } from 'url';
import jetpackWebpackConfig from '@automattic/jetpack-webpack-config/webpack';
import autoprefixer from 'autoprefixer';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

/**
 * Internal variables
 */
const sharedWebpackConfig = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	entry: {
		editor: './src/blocks/contact-form/editor.ts',
		view: './src/blocks/contact-form/view.ts',
		'form-progress-indicator/style': './src/blocks/form-progress-indicator/style.scss',
		'form-step-navigation/style': './src/blocks/form-step-navigation/style.scss',
		'field-rating/style': './src/blocks/field-rating/style.scss',
		'field-image-select/style': './src/blocks/field-image-select/style.scss',
		'input-range/style': './src/blocks/input-range/style.scss',
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '../dist/blocks' ),
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
			consumer_slug: 'jetpack-forms',
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

			// Handle CSS.
			jetpackWebpackConfig.CssRule( {
				extensions: [ 'css', 'sass', 'scss' ],
				extraLoaders: [
					{
						loader: 'postcss-loader',
						options: {
							// postcssOptions: { config: path.join( __dirname, 'postcss.config.js' ) },
							postcssOptions: { plugins: [ autoprefixer ] },
						},
					},
					{ loader: 'sass-loader', options: { api: 'modern-compiler' } },
				],
			} ),

			// Allow importing .svg files as React components via `?component` query.
			{
				test: /\.svg$/i,
				issuer: /\.[jt]sx?$/,
				resourceQuery: /component/,
				use: [ '@svgr/webpack' ],
			},

			// Allow importing .svg files as raw HTML strings via `?raw` query.
			{
				test: /\.svg$/i,
				resourceQuery: /raw/,
				type: 'asset/source',
			},

			// Handle images (exclude ?component and ?raw SVG imports).
			{
				...jetpackWebpackConfig.FileRule(),
				resourceQuery: { not: [ /component/, /raw/ ] },
			},
		],
	},
	watchOptions: {
		...jetpackWebpackConfig.watchOptions,
	},
};

export default [
	{
		...sharedWebpackConfig,
		plugins: [
			...sharedWebpackConfig.plugins,
			new CopyWebpackPlugin( {
				patterns: [
					{
						from: 'src/blocks/**/block.json',
						to: '[name][ext]',
						noErrorOnMissing: true,
					},
				],
			} ),
		],
	},
];
