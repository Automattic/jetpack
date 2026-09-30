/**
 * Builds the Jetpack Comments front-end bundle.
 */

import fs from 'fs';
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

// Packages and files the comment editor never runs, swapped for src/editor/stub.cjs. A stub that
// does run breaks the editor, so try the editor after changing this. Preferences loads with it.
const stubs = [
	// Uploads, media processing, site data, commands, the media inserter, dates, color, and math.
	'@wordpress/vips',
	'@wordpress/video-conversion',
	'@wordpress/upload-media',
	'@wordpress/core-data',
	'@wordpress/image-cropper',
	'react-easy-crop',
	'@wordpress/latex-to-mathml',
	'@wordpress/commands',
	'@wordpress/dataviews',
	'@wordpress/date',
	'date-fns',
	'@date-fns/tz',
	'react-day-picker',
	'colorjs.io',
	'postcss',
	'@use-gesture/react',
	'@use-gesture/core',
	// Resizing and the invalid-block comparison, for blocks the comment editor does not offer.
	're-resizable',
	'diff',
	// Sidebar and style controls; the comment editor has no sidebar.
	...[
		'angle-picker-control',
		'border-box-control',
		'border-control',
		'box-control',
		'circular-option-picker',
		'color-palette',
		'color-picker',
		'custom-gradient-picker',
		'date-time',
		'duotone-picker',
		'focal-point-picker',
		'font-size-picker',
		'gradient-picker',
		'modal',
		'navigator',
		'palette-edit',
		'range-control',
		'tabs',
		'tools-panel',
		'unit-control',
	].map( name => `@wordpress/components/build-module/${ name }/index.mjs` ),
	...[
		'background-image-control',
		'block-inspector',
		'block-preview',
		// The toolbar's "⋮" menu: nothing in it suits a comment.
		'block-settings-menu',
		'date-format-picker',
		'dimensions-tool',
		'global-styles',
		'grid',
		'iframe',
		// The "+" buttons: blocks come from the toolbar's menu and "/", which does not use this.
		'inserter',
		'list-view',
		'spacing-sizes-control',
	].map( name => `@wordpress/block-editor/build-module/components/${ name }/index.mjs` ),
	...[ 'advanced', 'background', 'color', 'filters', 'typography' ].map(
		name => `@wordpress/block-editor/build-module/components/global-styles/${ name }-panel.mjs`
	),
	...[ 'constrained', 'flex', 'grid' ].map(
		name => `@wordpress/block-editor/build-module/layouts/${ name }.mjs`
	),
	...[ 'autocomplete', 'combobox', 'searchable-chip-select', 'searchable-select', 'select' ].map(
		name => `@wordpress/ui/build-module/form/primitives/${ name }/index.mjs`
	),
	'@wordpress/ui/build-module/tabs/index.mjs',
	'@wordpress/block-editor/build-module/components/block-tools/empty-block-inserter.mjs',
];
const stubbed = new RegExp(
	`node_modules/(${ stubs.map( stub => stub.replace( /[.]/g, '\\.' ) ).join( '|' ) })(/|$)`
);

export default {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	entry: {
		comments: path.join( __dirname, 'src/form/index.tsx' ),
		admin: path.join( __dirname, 'src/editor/admin.ts' ),
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
				exclude: [ /node_modules\//, path.join( __dirname, 'src/editor' ) ],
				babelOpts,
			} ),

			// The block editor is React, on the preset's own JSX runtime.
			jetpackWebpackConfig.TranspileRule( {
				include: path.join( __dirname, 'src/editor' ),
				babelOpts: { ...babelOpts, plugins: [] },
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
		...jetpackWebpackConfig.StandardPlugins( {
			// Bundled, not core's wp-* scripts: the editor chunk pins its own versions.
			DependencyExtractionPlugin: { requestToExternal: () => false },
			// Its strings come from PHP; the editor chunk carries none of its own.
			I18nLoaderPlugin: false,
		} ),
		new webpack.NormalModuleReplacementPlugin( /./, resource => {
			// A relative import is matched by the file it names, so a stub reaches every copy pnpm installed.
			const target = resource.request.startsWith( '.' )
				? path.join( resource.context, resource.request )
				: 'node_modules/' + resource.request;

			if ( stubbed.test( target ) ) {
				resource.request = path.join( __dirname, 'src/editor/stub.cjs' );
			}
		} ),
		new webpack.ProvidePlugin( {
			h: [ 'preact', 'h' ],
			Fragment: [ 'preact', 'Fragment' ],
		} ),
		new webpack.DefinePlugin( {
			JETPACK_COMMENTS_VERSION: JSON.stringify(
				JSON.parse( fs.readFileSync( path.join( __dirname, 'package.json' ), 'utf8' ) ).version
			),
		} ),
	],
	watchOptions: {
		...jetpackWebpackConfig.watchOptions,
	},
};
