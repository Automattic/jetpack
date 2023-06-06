/**
 *WARNING: No ES6 modules here. Not transpiled! ****
 */

const fs = require( 'fs' );
const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const webpack = jetpackWebpackConfig.webpack;
const RemoveAssetWebpackPlugin = require( '@automattic/remove-asset-webpack-plugin' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const jsdom = require( 'jsdom' );
const CopyBlockEditorAssetsPlugin = require( './copy-block-editor-assets' );
const StaticSiteGeneratorPlugin = require( './static-site-generator-webpack-plugin' );

/**
 * Internal variables
 */
const editorSetup = path.join( __dirname, '../extensions', 'editor' );
const viewSetup = path.join( __dirname, '../extensions', 'view' );
const noop = function () {};

const presetPath = path.join( __dirname, '../extensions', 'index.json' );
const presetIndex = require( presetPath );
const presetProductionBlocks = presetIndex.production || [];

const presetExperimentalBlocks = [
	...presetProductionBlocks,
	...( presetIndex.experimental || [] ),
];
// Beta Blocks include all blocks: beta, experimental, and production blocks.
const presetBetaBlocks = [ ...presetExperimentalBlocks, ...( presetIndex.beta || [] ) ];

const editorBlocksScripts = presetBetaBlocks.reduce( ( editorBlocks, block ) => {
	const editorScriptPath = path.join( __dirname, '../extensions/blocks', block, 'editor.js' );
	if ( fs.existsSync( editorScriptPath ) ) {
		editorBlocks[ block + '/editor' ] = [ editorScriptPath ];
	}
	return editorBlocks;
}, {} );

// Helps split up each block into its own folder view script
const viewBlocksScripts = presetBetaBlocks.reduce( ( viewBlocks, block ) => {
	const viewScriptPath = path.join( __dirname, '../extensions/blocks', block, 'view.js' );
	if ( fs.existsSync( viewScriptPath ) ) {
		viewBlocks[ block + '/view' ] = [ viewSetup, ...[ viewScriptPath ] ];
	}
	return viewBlocks;
}, {} );

const sharedWebpackConfig = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '../_inc/blocks' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
	},
	node: {},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: { injectPolyfill: true },
		} ),
	],
	externals: {
		...jetpackWebpackConfig.externals,
		jetpackConfig: JSON.stringify( {
			consumer_slug: 'jetpack',
		} ),
	},
	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),

			// Transpile @automattic/* in node_modules too.
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [
					'@automattic/',
					'debug/',
					'gridicons/',
					'punycode/',
					'query-string/',
					'split-on-first/',
					'strict-uri-encode/',
				],
			} ),

			// Handle CSS.
			jetpackWebpackConfig.CssRule( {
				extensions: [ 'css', 'sass', 'scss' ],
				extraLoaders: [
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: { config: path.join( __dirname, 'postcss.config.js' ) },
						},
					},
					'sass-loader',
				],
			} ),

			// Allow importing .svg files as React components by appending `?component` to the import, e.g. `import Logo from './logo.svg?component';`
			{
				test: /\.svg$/i,
				issuer: /\.[jt]sx?$/,
				resourceQuery: /component/,
				use: [ '@svgr/webpack' ],
			},

			// Handle images.
			jetpackWebpackConfig.FileRule(),
		],
	},
};

// We export two configuration files: One for admin.js, and one for components.jsx.
// The latter produces pre-rendered components HTML.
module.exports = [
	{
		...sharedWebpackConfig,
		entry: {
			editor: editorSetup,
			...editorBlocksScripts,
			...viewBlocksScripts,
		},
		plugins: [
			...sharedWebpackConfig.plugins,
			new CopyWebpackPlugin( {
				patterns: [
					{
						from: presetPath,
						to: 'index.json',
					},
				],
			} ),
			new CopyBlockEditorAssetsPlugin(),
		],
	},
	{
		...sharedWebpackConfig,
		entry: {
			components: path.join( __dirname, '../extensions/shared/components/index.jsx' ),
		},
		output: {
			...sharedWebpackConfig.output,
			libraryTarget: 'commonjs2',
		},
		plugins: [
			...jetpackWebpackConfig.StandardPlugins( {
				DependencyExtractionPlugin: false,
				I18nLoaderPlugin: false,
				I18nCheckPlugin: false,
			} ),
			new webpack.NormalModuleReplacementPlugin(
				/^@wordpress\/i18n$/,
				// We want to exclude extensions/shared/i18n-to-php so we can import and re-export
				// any methods that we are not overriding
				resource => {
					if ( ! resource.contextInfo.issuer.includes( 'extensions/shared/i18n-to-php' ) ) {
						resource.request = path.join(
							path.dirname( __dirname ),
							'./extensions/shared/i18n-to-php'
						);
					}
				}
			),
			new webpack.NormalModuleReplacementPlugin(
				/^\.\/create-interpolate-element$/,
				path.join( path.dirname( __dirname ), './extensions/shared/element-to-php' )
			),
			new StaticSiteGeneratorPlugin( {
				// The following mocks are required to make `@wordpress/` npm imports work with server-side rendering.
				// Hopefully, most of them can be dropped once https://github.com/WordPress/gutenberg/pull/16227 lands.
				globals: {
					Mousetrap: {
						init: noop,
						prototype: {},
					},
					document: new jsdom.JSDOM().window.document,
					navigator: {},
					window: {
						addEventListener: noop,
						console: {
							error: noop,
							warn: noop,
						},
						// See https://github.com/WordPress/gutenberg/blob/f3b6379327ce3fb48a97cb52ffb7bf9e00e10130/packages/jest-preset-default/scripts/setup-globals.js
						matchMedia: () => ( {
							addListener: () => {},
						} ),
						navigator: { platform: '', userAgent: '' },
						Node: {
							TEXT_NODE: '',
							ELEMENT_NODE: '',
							DOCUMENT_POSITION_PRECEDING: '',
							DOCUMENT_POSITION_FOLLOWING: '',
						},
						removeEventListener: noop,
						URL: {},
					},
					CSS: {
						supports: () => false,
					},
					MessageChannel: null, // React <17.1 is broken on Node 16 if this is set. https://github.com/facebook/react/issues/20756#issuecomment-780927519
				},
			} ),
			new RemoveAssetWebpackPlugin( {
				assets: [ 'components.js', 'components.js.map' ],
			} ),
		],
	},
];
