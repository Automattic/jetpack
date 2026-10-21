/**
 * Builds the Jetpack Comments front-end bundle, and the settings card for Jetpack's Discussion settings.
 */

import fs from 'fs';
import path from 'path';
import jetpackTargets from '@automattic/jetpack-webpack-config/targets';
import jetpackWebpackConfig from '@automattic/jetpack-webpack-config/webpack';
import webpack from 'webpack';
import editorStubs from './tools/editor-stubs.js';

const __dirname = import.meta.dirname;

// Preact renders through `h`/`Fragment`, which the ProvidePlugin below supplies.
const babelOpts = {
	plugins: [
		[
			'@babel/plugin-transform-react-jsx',
			{
				pragma: 'h',
				pragmaFrag: 'Fragment',
				runtime: 'classic',
				useSpread: true,
			},
		],
	],
	targets: jetpackTargets,
	presets: [ [ '@automattic/jetpack-webpack-config/babel/preset' ] ],
};

const frontEnd = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	entry: {
		comments: path.join( __dirname, 'src/form/index.tsx' ),
		admin: path.join( __dirname, 'src/editor/admin.ts' ),
		// Not 'auto', whose runtime throws before any module runs when it finds no script URL.
		'editor-loader': { import: path.join( __dirname, 'src/editor/loader.ts' ), publicPath: '' },
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, 'build' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
		// Off by default to keep i18n calls extractable; this package ships no strings of its own to extract.
		concatenateModules: true,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
		alias: { 'framer-motion$': path.join( __dirname, 'tools/framer-motion.js' ) },
	},
	node: false,
	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript and TypeScript.
			jetpackWebpackConfig.TranspileRule( {
				exclude: [ /node_modules\//, path.join( __dirname, 'src/editor' ) ],
				babelOpts,
			} ),

			// The block editor is React, on the preset's own JSX runtime.
			jetpackWebpackConfig.TranspileRule( {
				include: path.join( __dirname, 'src/editor' ),
				babelOpts: { ...babelOpts, plugins: [] },
			} ),

			// Transpile @automattic/jetpack-* in node_modules too.
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@automattic/jetpack-' ],
			} ),

			// preact has `__` internal methods, which confuse i18n-check-webpack-plugin. Hack around that.
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ 'preact' ],
				babelOpts: {
					configFile: false,
					plugins: [ [ 'babel-plugin-transform-rename-properties', { rename: { __: '__ǃ' } } ] ],
					presets: [],
				},
			} ),

			// Handle CSS.
			jetpackWebpackConfig.CssRule( {
				extensions: [ 'css', 'sass', 'scss' ],
				extraLoaders: [
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: {
								config: path.join( __dirname, 'postcss.config.js' ),
							},
						},
					},
					{ loader: 'sass-loader', options: { api: 'modern-compiler' } },
				],
			} ),
		],
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			// Bundled, not core's wp-* scripts: the editor chunk pins its own versions.
			DependencyExtractionPlugin: { requestToExternal: () => false },
			// The editor speaks core's strings, in the default domain, which PHP hands over translated.
			I18nLoaderPlugin: false,
			I18nCheckPlugin: { expectDomain: 'default' },
		} ),
		editorStubs,
		new webpack.ProvidePlugin( {
			h: [ 'preact', 'h' ],
			Fragment: [ 'preact', 'Fragment' ],
		} ),
		new webpack.DefinePlugin( {
			JETPACK_COMMENTS_VERSION: JSON.stringify(
				JSON.parse( fs.readFileSync( path.join( __dirname, 'package.json' ), 'utf8' ) ).version
			),
		} ),
	],
	watchOptions: {
		...jetpackWebpackConfig.watchOptions,
	},
};

// React from core, like the dashboard that renders it, and strings in the package's own domain.
const settings = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	entry: {
		settings: path.join( __dirname, 'src/settings/main.tsx' ),
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, 'build' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
	},
	externals: {
		...jetpackWebpackConfig.externals,
	},
	node: false,
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
				extraLoaders: [
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: {
								config: path.join( __dirname, 'postcss.config.js' ),
							},
						},
					},
					{ loader: 'sass-loader', options: { api: 'modern-compiler' } },
				],
			} ),
		],
	},
	plugins: [ ...jetpackWebpackConfig.StandardPlugins() ],
	watchOptions: {
		...jetpackWebpackConfig.watchOptions,
	},
};

export default [ frontEnd, settings ];
