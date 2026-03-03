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
const blockEditorDirectories = [ 'plugins', 'blocks' ];

/**
 * Filters block editor scripts
 *
 * @param {string} type         - script type
 * @param {string} inputDir     - input directory
 * @param {Array}  presetBlocks - preset blocks
 * @return {Array} list of block scripts
 */
function presetProductionExtensions( type, inputDir, presetBlocks ) {
	return presetBlocks
		.flatMap( block =>
			blockEditorDirectories.map( dir => path.join( inputDir, dir, block, `${ type }.js` ) )
		)
		.filter( fs.existsSync );
}

const presetPath = path.join( __dirname, '../extensions', 'index.json' );
const presetIndex = require( presetPath );
const presetProductionBlocks = presetIndex.production || [];
const presetNoPostEditorBlocks = presetIndex[ 'no-post-editor' ] || [];

const presetExperimentalBlocks = [
	...presetProductionBlocks,
	...( presetIndex.experimental || [] ),
];
// Beta Blocks include all blocks: beta, experimental, and production blocks.
const presetBetaBlocks = [ ...presetExperimentalBlocks, ...( presetIndex.beta || [] ) ];

// Helps split up each block into its own folder view script
const viewBlocksScripts = presetBetaBlocks.reduce( ( viewBlocks, block ) => {
	const viewScriptPath = path.join( __dirname, '../extensions/blocks', block, 'view.js' );
	if ( fs.existsSync( viewScriptPath ) ) {
		viewBlocks[ block + '/view' ] = [ viewSetup, ...[ viewScriptPath ] ];
	}
	return viewBlocks;
}, {} );

// Helps split up each block into its own folder admin script
const adminBlocksScripts = presetBetaBlocks.reduce( ( adminBlocks, block ) => {
	const adminScriptPath = path.join( __dirname, '../extensions/blocks', block, 'admin.js' );
	if ( fs.existsSync( adminScriptPath ) ) {
		adminBlocks[ block + '/admin' ] = adminScriptPath;
	}
	return adminBlocks;
}, {} );

// Combines all the different production blocks into one editor.js script
const editorScript = [
	editorSetup,
	...presetProductionExtensions(
		'editor',
		path.join( __dirname, '../extensions' ),
		presetProductionBlocks
	),
];

// Combines all the different Experimental blocks into one editor.js script
const editorExperimentalScript = [
	editorSetup,
	...presetProductionExtensions(
		'editor',
		path.join( __dirname, '../extensions' ),
		presetExperimentalBlocks
	),
];

// Combines all the different blocks into one editor-beta.js script
const editorBetaScript = [
	editorSetup,
	...presetProductionExtensions(
		'editor',
		path.join( __dirname, '../extensions' ),
		presetBetaBlocks
	),
];

const editorNoPostEditorScript = [
	editorSetup,
	...presetProductionExtensions(
		'editor',
		path.join( __dirname, '../extensions' ),
		presetNoPostEditorBlocks
	),
];

const sharedWebpackConfig = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '../_inc/blocks' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
		// Extract shared node_modules code that appears in two or more per-block
		// view/admin scripts into a single `blocks-view-vendors` chunk. When a page
		// contains multiple blocks (e.g. VideoPress + Subscriptions), this prevents
		// the shared @automattic/* libraries from being downloaded twice.
		// The monolithic editor.js bundles are not affected (no async imports).
		//
		// Future work: migrate each block's editor code to a per-block editorScript
		// registered via block.json so the ~5 MB monolithic editor bundles can be
		// replaced with per-block async chunks, eliminating the large up-front
		// download in the block editor. That requires:
		//   1. A webpack entry per block (e.g. extensions/blocks/<name>/editor.js)
		//   2. A registered WP script handle per block pointing to that entry
		//   3. `editorScript: "jetpack/<name>-editor"` in each block's block.json
		//   4. Removing the manual enqueue in class.jetpack-gutenberg.php
		splitChunks: {
			chunks: 'all',
			cacheGroups: {
				blockViewVendors: {
					test: /[\\/]node_modules[\\/]/,
					name: 'blocks-view-vendors',
					// Only extract a shared chunk from the per-block view/admin entries,
					// not the monolithic editor bundles (those are mutually exclusive).
					chunks: chunk =>
						!! chunk.name &&
						( chunk.name.endsWith( '/view' ) || chunk.name.endsWith( '/admin' ) ),
					minChunks: 2,
					priority: 10,
				},
			},
		},
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
	},
	node: {},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			MiniCssExtractPlugin: {
				// This is a bit of a hack to handle simple cases of `import( './file.css' )` in block editor scripts.
				// If we're ever able to get rid of the monolithic editor.js files, this should go away in favor
				// of doing the `import()` from inside the `script` (not `editorScript` or `viewScript`).
				insert: linkTag => {
					// Insert at the top level, in the way minicss does normally.
					/* global oldTag */
					if ( oldTag ) {
						oldTag.parentNode.insertBefore( linkTag, oldTag.nextSibling );
					} else {
						document.head.appendChild( linkTag );
					}

					// Also insert into any editor-canvas iframes.
					for ( const iframe of document.querySelectorAll( 'iframe[name=editor-canvas]' ) ) {
						try {
							const iframeDoc = iframe.contentDocument;
							iframeDoc.head.appendChild( iframeDoc.importNode( linkTag ) );
						} catch {
							// Browser won't allow access. Never mind.
						}
					}
				},
			},
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
					{ loader: 'sass-loader', options: { api: 'modern-compiler' } },
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

// We export three configuration files:
// - admin.js
// - components.jsx, which produces pre-rendered components HTML
// - swiper.js
module.exports = [
	{
		...sharedWebpackConfig,
		entry: {
			editor: editorScript,
			'editor-experimental': editorExperimentalScript,
			'editor-beta': editorBetaScript,
			'editor-no-post-editor': editorNoPostEditorScript,
			...viewBlocksScripts,
			...adminBlocksScripts,
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
			new CopyWebpackPlugin( {
				patterns: [
					{
						from: '**/block.json',
						to: '[path][name][ext]',
						context: path.join( __dirname, '../extensions/blocks' ),
						noErrorOnMissing: true,
						// Automatically link scripts and styles
						transform( content ) {
							const metadata = JSON.parse( content.toString() );
							const name = metadata.name.replace( 'jetpack/', '' );

							if ( ! name ) {
								return metadata;
							}

							// `editorScript` is required for block.json to be valid and WordPress.org to be able
							// to parse it before building the page at https://wordpress.org/plugins/jetpack/.
							// Don't add other scripts or styles while block assets are still enqueued manually
							// in the backend.
							const result = {
								...metadata,
								editorScript: `jetpack-blocks-editor`,
							};

							return JSON.stringify( result, null, 4 );
						},
					},
				],
			} ),
			new CopyBlockEditorAssetsPlugin(),
		],
	},
	// Components configuration
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
							'./extensions/shared/i18n-to-php.js'
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
				globals: {
					document: new jsdom.JSDOM().window.document,
					window: {},
				},
			} ),
			new RemoveAssetWebpackPlugin( {
				assets: [ 'components.js', 'components.js.map' ],
			} ),
		],
	},
	{
		...sharedWebpackConfig,
		entry: {
			swiper: path.join( __dirname, '../extensions/blocks/slideshow/swiper-entry.js' ),
		},
	},
];
