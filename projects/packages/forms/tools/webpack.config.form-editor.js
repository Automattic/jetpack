/**
 * Builds the forms dashboard JS bundle.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import jetpackWebpackConfig from '@automattic/jetpack-webpack-config/webpack';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

export default {
	mode: jetpackWebpackConfig.mode,
	entry: {
		'jetpack-forms-editor': path.join( __dirname, '..', 'src/form-editor/index.tsx' ),
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '..', 'dist/form-editor' ),
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
			'@wordpress/admin-ui/build-style/style.css': path.join(
				__dirname,
				'..',
				'node_modules',
				'@wordpress',
				'admin-ui',
				'build-style',
				'style.css'
			),
		},
	},
	externals: {
		...jetpackWebpackConfig.externals,
		jetpackConfig: JSON.stringify( {
			consumer_slug: 'jetpack-forms',
		} ),
	},
	module: {
		rules: [
			// Gutenberg packages' ESM builds don't fully specify their imports. Sigh.
			// https://github.com/WordPress/gutenberg/issues/73362
			{
				test: /\/node_modules\/@wordpress\/.*\/build-module\/.*\.js$/,
				resolve: { fullySpecified: false },
			},

			// Transpile JavaScript
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),

			// Transpile @automattic/* in node_modules too.
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@automattic/', 'debug/' ],
			} ),

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
					'@wordpress/admin-ui/build-style/style.css': { external: false },
					// Bundle jetpack-connection since it's used by IntegrationsModal
					'@automattic/jetpack-connection': { external: false },
				},
			},
		} ),
	],
	watchOptions: {
		...jetpackWebpackConfig.watchOptions,
	},
};
