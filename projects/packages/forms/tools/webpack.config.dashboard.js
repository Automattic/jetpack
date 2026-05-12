/**
 * Builds the forms dashboard JS bundle.
 */

import path from 'path';
import jetpackWebpackConfig from '@automattic/jetpack-webpack-config/webpack';
import { NodePackageImporter } from 'sass-embedded';

const __dirname = import.meta.dirname;

export default {
	mode: jetpackWebpackConfig.mode,
	entry: {
		'jetpack-forms-dashboard': path.join( __dirname, '..', 'src/dashboard/index.tsx' ),
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '..', 'dist/dashboard' ),
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
			consumer_slug: 'jetpack-forms',
		} ),
	},
	module: {
		rules: [
			// Transpile JavaScript
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
				extraLoaders: [
					{
						loader: 'sass-loader',
						options: {
							api: 'modern-compiler',
							sassOptions: {
								importers: [ new NodePackageImporter() ],
							},
						},
					},
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
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: {
				requestMap: {
					// Bundle the package with our assets until WP core exposes wp-admin-ui.
					'@wordpress/admin-ui': { external: false },
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
