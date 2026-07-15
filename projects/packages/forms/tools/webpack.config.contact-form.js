/**
 * This takes care of minifying CSS and JS.
 */

import path from 'path';
import jetpackWebpackConfig from '@automattic/jetpack-webpack-config/webpack';
import RemoveAssetWebpackPlugin from '@automattic/remove-asset-webpack-plugin';
import { glob } from 'glob';

const __dirname = import.meta.dirname;

const scriptSrcDir = path.join( __dirname, '../src/contact-form/js' );
const styleSrcDir = path.join( __dirname, '../src/contact-form/css' );

const sharedWebpackConfig = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '../dist/contact-form' ),
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
	node: {},
	externals: {
		...jetpackWebpackConfig.externals,
		jetpackConfig: JSON.stringify( {
			consumer_slug: 'jetpack-forms',
		} ),
	},
	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),

			// Handle CSS.
			jetpackWebpackConfig.CssRule( {
				extensions: [ 'css', 'sass', 'scss' ],
				extraLoaders: [
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: {
								config: path.join( __dirname, '..', 'postcss.config.js' ),
							},
						},
					},
					{
						loader: 'sass-loader',
						options: {
							api: 'modern-compiler',
							sassOptions: {
								// The minifier will minify if necessary.
								style: 'expanded',
							},
						},
					},
				],
			} ),

			// Leave fonts and images in place.
			{
				test: /\.(eot|ttf|woff|png|svg)$/i,
				type: 'asset/resource',
				generator: {
					emit: false,
					filename: '[file]',
				},
			},
		],
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: false,
			I18nLoaderPlugin: false,
			I18nCheckPlugin: false,
		} ),
		// Delete the dummy JS files Webpack would otherwise create.
		new RemoveAssetWebpackPlugin( {
			assets: name =>
				name.startsWith( 'css' ) && ( name.endsWith( '.js' ) || name.endsWith( 'map' ) ),
		} ),
	],
	watchOptions: {
		...jetpackWebpackConfig.watchOptions,
	},
};

// CSS files using `wp_style_add_data( $handle, 'rtl', 'replace' )` need the
// RTL version to be named like "module-rtl.css" and "module-rtl.min.css"
// rather than "module.rtl.css" and "module.min.rtl.css" like our Webpack
// config does it.
// This minimal plugin renames the relevant assets to conform to that style.
const RenamerPlugin = {
	apply( compiler ) {
		compiler.hooks.thisCompilation.tap( 'Renamer', compilation => {
			compilation.hooks.processAssets.tap(
				{
					name: 'Renamer',
					stage: jetpackWebpackConfig.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
					additionalAssets: true,
				},
				assets => {
					for ( const [ name, asset ] of Object.entries( assets ) ) {
						const m = name.match( /^(css\/(?:grunion|editor-ui))((?:\.min)?)\.rtl\.css$/ );
						if ( m ) {
							delete assets[ name ];
							assets[ `${ m[ 1 ] }-rtl${ m[ 2 ] }.css` ] = asset;
						}
					}
				}
			);
		} );
	},
};

export default [
	{
		...sharedWebpackConfig,
		entry: glob.sync( path.join( scriptSrcDir, '*.{js,ts,tsx}' ) ).reduce( ( acc, filepath ) => {
			acc[ 'js/' + path.parse( filepath ).name ] = filepath;
			return acc;
		}, {} ),
	},
	{
		...sharedWebpackConfig,
		entry: glob.sync( path.join( styleSrcDir, '*.{css,scss}' ) ).reduce( ( acc, filepath ) => {
			acc[ 'css/' + path.parse( filepath ).name ] = filepath;
			return acc;
		}, {} ),
		plugins: [ ...sharedWebpackConfig.plugins, RenamerPlugin ],
	},
];
