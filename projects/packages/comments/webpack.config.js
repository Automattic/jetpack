/**
 * Builds the Jetpack Comments front-end bundle.
 */

import path from 'path';
import jetpackTargets from '@automattic/jetpack-webpack-config/targets';
import jetpackWebpackConfig from '@automattic/jetpack-webpack-config/webpack';
import webpack from 'webpack';

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

export default {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	entry: {
		comments: path.join( __dirname, 'src/form/index.tsx' ),
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
	node: false,
	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript and TypeScript.
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
				babelOpts,
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
		...jetpackWebpackConfig.StandardPlugins(),
		new webpack.ProvidePlugin( {
			h: [ 'preact', 'h' ],
			Fragment: [ 'preact', 'Fragment' ],
		} ),
	],
	watchOptions: {
		...jetpackWebpackConfig.watchOptions,
	},
};
