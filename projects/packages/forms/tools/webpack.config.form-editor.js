/**
 * Builds the forms editor JS bundle.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import jetpackWebpackConfig from '@automattic/jetpack-webpack-config/webpack';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

export default {
	mode: jetpackWebpackConfig.mode,
	entry: {
		'jetpack-form-editor': path.join( __dirname, '..', 'src/form-editor/index.tsx' ),
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
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: {
				requestMap: {},
			},
		} ),
	],
	watchOptions: {
		...jetpackWebpackConfig.watchOptions,
	},
};
