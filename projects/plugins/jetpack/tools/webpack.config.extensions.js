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
const aiEditorSetup = path.join( __dirname, '../extensions', 'editor-ai' );
const viewSetup = path.join( __dirname, '../extensions', 'view' );
const blockEditorDirectories = [ 'plugins', 'blocks' ];

/**
 * AI extensions ship in the editor-ai bundles instead of the main editor
 * bundles, so the AI gate can stop them loading at all. Only preset names that
 * resolve to editor scripts matter here — flag-only entries never contribute
 * code. `extensions/index.json` itself is left untouched: it also drives PHP
 * extension availability and the beta labeling in the editor.
 *
 * The `no-post-editor` bundle is NOT split: nothing in this repo enqueues it
 * (WordPress.com consumes it out of tree), so removing AI from it would
 * silently drop those extensions there until a wpcom-side change enqueues the
 * split file.
 */
const aiExtensions = [
	'ai-assistant',
	'ai-chat',
	'ai-assistant-plugin',
	'ai-content-lens',
	'voice-to-content',
];

/**
 * Filter AI extensions out of a preset list.
 *
 * @param {Array} presetBlocks - preset blocks
 * @return {Array} preset blocks without the AI extensions
 */
function withoutAiExtensions( presetBlocks ) {
	return presetBlocks.filter( block => ! aiExtensions.includes( block ) );
}

/**
 * Keep only the AI extensions from a preset list.
 *
 * @param {Array} presetBlocks - preset blocks
 * @return {Array} the AI extensions present in the preset list
 */
function onlyAiExtensions( presetBlocks ) {
	return presetBlocks.filter( block => aiExtensions.includes( block ) );
}

/**
 * Resolves a block script path to either a `.js` or `.jsx` file.
 * Exactly one variant may exist.
 *
 * @param {...string} parts - Path segments of the script, without extension.
 * @throws {Error} If both `.js` and `.jsx` variants exist for the same script.
 * @return {?string} The resolved path, or null if neither variant exists.
 */
function resolveScript( ...parts ) {
	const base = path.join( ...parts );
	const found = [ '.js', '.jsx' ].map( ext => base + ext ).filter( fs.existsSync );
	if ( found.length > 1 ) {
		throw new Error( `Ambiguous script: both ${ found.join( ' and ' ) } exist. Pick one.` );
	}
	return found[ 0 ] || null;
}

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
			blockEditorDirectories.map( dir => resolveScript( inputDir, dir, block, type ) )
		)
		.filter( Boolean );
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
	const viewScriptPath = resolveScript( __dirname, '../extensions/blocks', block, 'view' );
	if ( viewScriptPath ) {
		viewBlocks[ block + '/view' ] = [ viewSetup, viewScriptPath ];
	}
	return viewBlocks;
}, {} );

// Helps split up each block into its own folder admin script
const adminBlocksScripts = presetBetaBlocks.reduce( ( adminBlocks, block ) => {
	const adminScriptPath = resolveScript( __dirname, '../extensions/blocks', block, 'admin' );
	if ( adminScriptPath ) {
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
		withoutAiExtensions( presetProductionBlocks )
	),
];

// Combines all the different Experimental blocks into one editor.js script
const editorExperimentalScript = [
	editorSetup,
	...presetProductionExtensions(
		'editor',
		path.join( __dirname, '../extensions' ),
		withoutAiExtensions( presetExperimentalBlocks )
	),
];

// Combines all the different blocks into one editor-beta.js script
const editorBetaScript = [
	editorSetup,
	...presetProductionExtensions(
		'editor',
		path.join( __dirname, '../extensions' ),
		withoutAiExtensions( presetBetaBlocks )
	),
];

// The AI extensions, one editor-ai bundle per variation to mirror the
// editor{-variant}.js filename scheme the PHP loader interpolates.
const editorAiScript = [
	aiEditorSetup,
	...presetProductionExtensions(
		'editor',
		path.join( __dirname, '../extensions' ),
		onlyAiExtensions( presetProductionBlocks )
	),
];

const editorAiExperimentalScript = [
	aiEditorSetup,
	...presetProductionExtensions(
		'editor',
		path.join( __dirname, '../extensions' ),
		onlyAiExtensions( presetExperimentalBlocks )
	),
];

const editorAiBetaScript = [
	aiEditorSetup,
	...presetProductionExtensions(
		'editor',
		path.join( __dirname, '../extensions' ),
		onlyAiExtensions( presetBetaBlocks )
	),
];

const editorNoPostEditorScript = [
	editorSetup,
	// This bundle is not split (see the aiExtensions note), and its setup no
	// longer pulls in core-site-logo — keep shipping it here explicitly.
	path.join( __dirname, '../extensions/extended-blocks/core-site-logo/index.tsx' ),
	...presetProductionExtensions(
		'editor',
		path.join( __dirname, '../extensions' ),
		presetNoPostEditorBlocks
	),
];

const sharedWebpackConfig = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	cache: jetpackWebpackConfig.cache( __filename ),
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

			// Workarounds for non-extracted `@wordpress/*` packages.
			...jetpackWebpackConfig.BundledWpPkgsTranspileRules(),

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
			// The AI bundles reuse modules already shipped by their matching
			// editor bundle (dependOn) instead of duplicating them — the PHP
			// loader registers editor-ai with a hard script dependency on the
			// main bundle, so the required load order is guaranteed.
			'editor-ai': { import: editorAiScript, dependOn: 'editor' },
			'editor-ai-experimental': {
				import: editorAiExperimentalScript,
				dependOn: 'editor-experimental',
			},
			'editor-ai-beta': { import: editorAiBetaScript, dependOn: 'editor-beta' },
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
							// in the backend. AI blocks ship in the editor-ai bundle.
							const result = {
								...metadata,
								editorScript: aiExtensions.includes( name )
									? `jetpack-blocks-editor-ai`
									: `jetpack-blocks-editor`,
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
							'./extensions/shared/i18n-to-php.jsx'
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
