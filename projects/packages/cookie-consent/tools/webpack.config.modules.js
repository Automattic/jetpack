/**
 * Webpack configuration for building the cookie-consent Interactivity script module.
 */
import path from 'path';
import jetpackWebpackConfig from '@automattic/jetpack-webpack-config/webpack';
import autoprefixer from 'autoprefixer';

const __dirname = import.meta.dirname;

export default {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	entry: {
		'cookie-consent/index': path.join( __dirname, '../src/modules/cookie-consent/index.ts' ),
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '../build/modules' ),
		module: true,
		chunkFormat: 'module',
		environment: { module: true },
		library: { type: 'module' },
	},
	experiments: { outputModule: true },
	optimization: { ...jetpackWebpackConfig.optimization },
	resolve: {
		...jetpackWebpackConfig.resolve,
	},
	externals: {
		...jetpackWebpackConfig.externals,
	},
	module: {
		strictExportPresence: true,
		rules: [
			jetpackWebpackConfig.TranspileRule( { exclude: /node_modules\// } ),
			jetpackWebpackConfig.CssRule( {
				extensions: [ 'css', 'sass', 'scss' ],
				extraLoaders: [
					{
						loader: 'postcss-loader',
						options: { postcssOptions: { plugins: [ autoprefixer ] } },
					},
					{
						loader: 'sass-loader',
						options: { api: 'modern-compiler', sassOptions: { style: 'expanded' } },
					},
				],
			} ),
		],
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: true,
			I18nLoaderPlugin: false,
			I18nCheckPlugin: false,
		} ),
	],
	watchOptions: { ...jetpackWebpackConfig.watchOptions },
};
