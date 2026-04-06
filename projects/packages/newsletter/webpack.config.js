/**
 * Builds the newsletter JS bundle.
 */

import path from 'path';
import jetpackWebpackConfig from '@automattic/jetpack-webpack-config/webpack';

const __dirname = import.meta.dirname;

export default {
	mode: jetpackWebpackConfig.mode,
	entry: {
		newsletter: path.join( __dirname, 'src/settings/index.tsx' ),
		'reader-link': path.join( __dirname, 'src/reader-link/style.scss' ),
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
			consumer_slug: 'newsletter',
		} ),
	},
	module: {
		rules: [
			// Transpile JavaScript and TypeScript
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),

			// Transpile @automattic/* in node_modules too.
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@automattic/', 'debug/' ],
			} ),

			// Workarounds for non-extracted `@wordpress/*` packages.
			...jetpackWebpackConfig.BundledWpPkgsTranspileRules(),

			// Handle CSS.
			jetpackWebpackConfig.CssRule( {
				extensions: [ 'css', 'sass', 'scss' ],
				extraLoaders: [ { loader: 'sass-loader', options: { api: 'modern-compiler' } } ],
			} ),

			// Handle images.
			jetpackWebpackConfig.FileRule(),
		],
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: {
				requestMap: {
					// Bundle the package with our assets until WP core exposes wp-admin-ui.
					'@wordpress/admin-ui': { external: false },
				},
			},
		} ),
	],
	watchOptions: {
		...jetpackWebpackConfig.watchOptions,
	},
};
