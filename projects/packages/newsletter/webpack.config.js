/**
 * Builds the newsletter JS bundle.
 */

import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import jetpackWebpackConfig from '@automattic/jetpack-webpack-config/webpack';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const require = createRequire( import.meta.url );

/**
 * Generate i18n function variants for @automattic/babel-plugin-replace-textdomain.
 *
 * The @wordpress/dataviews currently uses the i18n functions under a variety of aliases,
 * which makes it a pain to add the proper textdomain. This function generates an object
 * with the base function and 99 more variants as keys.
 *
 * @param {string} baseFn - Base function name (e.g., '__', '_x', '_n')
 * @param {number} value  - Textdomain argument position (1-based index)
 * @return {object} Object mapping function names to textdomain positions
 */
const generateI18nVariants = ( baseFn, value ) =>
	Object.fromEntries(
		Array.from( { length: 100 }, ( _, i ) => [
			`${ baseFn }${ i || '' }`, // empty suffix for 0
			value,
		] )
	);

export default {
	mode: jetpackWebpackConfig.mode,
	entry: {
		newsletter: path.join( __dirname, 'src/settings/index.tsx' ),
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
			// Gutenberg packages' ESM builds don't fully specify their imports. Sigh.
			// https://github.com/WordPress/gutenberg/issues/73362
			{
				test: /\/node_modules\/@wordpress\/.*\/build-module\/.*\.js$/,
				resolve: { fullySpecified: false },
			},

			// Transpile JavaScript and TypeScript
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),

			// Transpile @automattic/* in node_modules too.
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@automattic/', 'debug/' ],
			} ),

			/**
			 * Transpile @wordpress/dataviews in node_modules too.
			 *
			 * @see https://github.com/Automattic/jetpack/issues/39907
			 */
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@wordpress/dataviews/build-wp/' ],
				babelOpts: {
					configFile: false,
					plugins: [
						[
							require.resolve( '@automattic/babel-plugin-replace-textdomain' ),
							{
								textdomain: 'jetpack-newsletter',
								functions: {
									...generateI18nVariants( '__', 1 ),
									...generateI18nVariants( '_x', 2 ),
									...generateI18nVariants( '_n', 3 ),
								},
							},
						],
					],
				},
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
				},
			},
		} ),
	],
	watchOptions: {
		...jetpackWebpackConfig.watchOptions,
	},
};
