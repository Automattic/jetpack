/**
 * Webpack config for blocks
 */

import path from 'path';
import jetpackWebpackConfig from '@automattic/jetpack-webpack-config/webpack';
import autoprefixer from 'autoprefixer';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const __dirname = import.meta.dirname;

/**
 * Internal variables
 */
const sharedWebpackConfig = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	entry: {
		editor: './src/blocks/contact-form/editor.ts',
		'ai-form-plugin': {
			import: './src/blocks/contact-form/plugins/ai-form-generation.ts',
			dependOn: 'editor',
		},
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
		// We need a more unique uniqueName here so ai-form-plugin's `dependOn` doesn't get confused with modules from other builds in the package.
		uniqueName: jetpackWebpackConfig.output.uniqueName + '/blocks',
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

			// Workarounds for non-extracted `@wordpress/*` packages.
			...jetpackWebpackConfig.BundledWpPkgsTranspileRules(),

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

			// Allow importing .svg files as raw HTML strings via `?raw` query.
			{
				test: /\.svg$/i,
				resourceQuery: /raw/,
				type: 'asset/source',
			},

			// Handle images (exclude ?raw SVG imports).
			{
				...jetpackWebpackConfig.FileRule(),
				resourceQuery: { not: [ /raw/ ] },
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
