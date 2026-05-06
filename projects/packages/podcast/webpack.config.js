/**
 * Builds the podcast JS bundle.
 */

import path from 'path';
import jetpackWebpackConfig from '@automattic/jetpack-webpack-config/webpack';

const __dirname = import.meta.dirname;

export default {
	mode: jetpackWebpackConfig.mode,
	entry: {
		podcast: path.join( __dirname, 'src/dashboard/index.tsx' ),
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
		modules: [ 'node_modules' ],
		alias: {
			...jetpackWebpackConfig.resolve.alias,
			fs: false,
		},
	},
	externals: {
		...jetpackWebpackConfig.externals,
		jetpackConfig: JSON.stringify( {
			consumer_slug: 'podcast',
		} ),
	},
	module: {
		rules: [
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@automattic/', 'debug/' ],
			} ),
			...jetpackWebpackConfig.BundledWpPkgsTranspileRules(),
			jetpackWebpackConfig.CssRule( {
				extensions: [ 'css', 'sass', 'scss' ],
				extraLoaders: [ { loader: 'sass-loader', options: { api: 'modern-compiler' } } ],
			} ),
			jetpackWebpackConfig.FileRule(),
		],
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: {
				requestMap: {
					'@wordpress/admin-ui': { external: false },
				},
			},
		} ),
	],
	watchOptions: {
		...jetpackWebpackConfig.watchOptions,
	},
};
