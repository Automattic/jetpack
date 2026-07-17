/**
 * Block-editor bundle for the jetpack-podcast package. The wp-build pipeline in
 * `package.json` handles the admin SPA; this config builds the Gutenberg block(s)
 * that ship alongside it. Mirrors the pattern used by paypal-payments and forms.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jetpackWebpackConfig from '@automattic/jetpack-webpack-config/webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

const sharedWebpackConfig = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	entry: {
		'podcast-episode/editor': './src/blocks/podcast-episode/editor.ts',
		'podcast-episode/style': './src/blocks/podcast-episode/style.scss',
		'podcast-episode/view': './src/blocks/podcast-episode/view.ts',
		'post-publish-podcast-promo/editor': './src/editor/post-publish-podcast-promo/index.tsx',
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, './dist/blocks' ),
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
			consumer_slug: 'jetpack-podcast',
		} ),
	},
	module: {
		strictExportPresence: true,
		rules: [
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@automattic/' ],
			} ),
			jetpackWebpackConfig.CssRule( {
				extensions: [ 'css', 'sass', 'scss' ],
				extraLoaders: [ { loader: 'sass-loader', options: { api: 'modern-compiler' } } ],
			} ),
			jetpackWebpackConfig.FileRule(),
		],
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
						from: '**/block.json',
						to: '[path][name][ext]',
						context: path.join( __dirname, 'src/blocks' ),
						noErrorOnMissing: true,
					},
				],
			} ),
		],
	},
];
