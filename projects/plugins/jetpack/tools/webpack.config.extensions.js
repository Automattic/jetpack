/**
 *WARNING: No ES6 modules here. Not transpiled! ****
 */
/* eslint-disable lodash/import-scope */

/**
 * External dependencies
 */
const _ = require( 'lodash' );
const fs = require( 'fs' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const getBaseWebpackConfig = require( '@automattic/calypso-build/webpack.config.js' );
const path = require( 'path' );
const webpack = require( 'webpack' );
const StaticSiteGeneratorPlugin = require( 'static-site-generator-webpack-plugin' );
const jsdom = require( 'jsdom' );

/**
 * Internal dependencies
 */
const CopyBlockEditorAssetsPlugin = require( './copy-block-editor-assets' );
// const { workerCount } = require( './webpack.common' ); // todo: shard...

/**
 * Internal variables
 */
const editorSetup = path.join( path.dirname( __dirname ), 'extensions', 'editor' );
const viewSetup = path.join( path.dirname( __dirname ), 'extensions', 'view' );
const blockEditorDirectories = [ 'blocks', 'plugins' ];

/**
 * Filters block editor scripts
 *
 * @param {string} type - script type
 * @param {string} inputDir - input directory
 * @param {Array} presetBlocks - preset blocks
 * @returns {Array} list of block scripts
 */
function presetProductionExtensions( type, inputDir, presetBlocks ) {
	return blockEditorDirectories
		.flatMap( dir =>
			presetBlocks.map( block => path.join( inputDir, dir, block, `${ type }.js` ) )
		)
		.filter( fs.existsSync );
}

const presetPath = path.join( path.dirname( __dirname ), 'extensions', 'index.json' );
const presetIndex = require( presetPath );
const presetProductionBlocks = _.get( presetIndex, [ 'production' ], [] );
const presetNoPostEditorBlocks = _.get( presetIndex, [ 'no-post-editor' ], [] );

const presetExperimentalBlocks = [
	...presetProductionBlocks,
	..._.get( presetIndex, [ 'experimental' ], [] ),
];
// Beta Blocks include all blocks: beta, experimental, and production blocks.
const presetBetaBlocks = [ ...presetExperimentalBlocks, ..._.get( presetIndex, [ 'beta' ], [] ) ];

// Helps split up each block into its own folder view script
const viewBlocksScripts = presetBetaBlocks.reduce( ( viewBlocks, block ) => {
	const viewScriptPath = path.join(
		path.dirname( __dirname ),
		'extensions',
		'blocks',
		block,
		'view.js'
	);
	if ( fs.existsSync( viewScriptPath ) ) {
		viewBlocks[ block + '/view' ] = [ viewSetup, ...[ viewScriptPath ] ];
	}
	return viewBlocks;
}, {} );

// Combines all the different production blocks into one editor.js script
const editorScript = [
	editorSetup,
	...presetProductionExtensions(
		'editor',
		path.join( path.dirname( __dirname ), 'extensions' ),
		presetProductionBlocks
	),
];

// Combines all the different Experimental blocks into one editor.js script
const editorExperimentalScript = [
	editorSetup,
	...presetProductionExtensions(
		'editor',
		path.join( path.dirname( __dirname ), 'extensions' ),
		presetExperimentalBlocks
	),
];

// Combines all the different blocks into one editor-beta.js script
const editorBetaScript = [
	editorSetup,
	...presetProductionExtensions(
		'editor',
		path.join( path.dirname( __dirname ), 'extensions' ),
		presetBetaBlocks
	),
];

const editorNoPostEditorScript = [
	editorSetup,
	...presetProductionExtensions(
		'editor',
		path.join( path.dirname( __dirname ), 'extensions' ),
		presetNoPostEditorBlocks
	),
];

const extensionsWebpackConfig = getBaseWebpackConfig(
	{ WP: true },
	{
		entry: {
			editor: editorScript,
			'editor-experimental': editorExperimentalScript,
			'editor-beta': editorBetaScript,
			'editor-no-post-editor': editorNoPostEditorScript,
			...viewBlocksScripts,
		},
		'output-filename': '[name].min.js',
		'output-chunk-filename': '[name].[chunkhash].js',
		'output-path': path.join( path.dirname( __dirname ), '_inc', 'blocks' ),
		'output-jsonp-function': 'webpackJsonpJetpack',
	}
);

const componentsWebpackConfig = getBaseWebpackConfig(
	{ WP: false },
	{
		entry: {
			components: path.join(
				path.dirname( __dirname ),
				'./extensions/shared/components/index.jsx'
			),
		},
		'output-chunk-filename': '[name].[chunkhash].js',
		'output-library-target': 'commonjs2',
		'output-path': path.join( path.dirname( __dirname ), '_inc', 'blocks' ),
		'output-pathinfo': true,
	}
);

/**
 * Calyso Build sets publicPath to '/' instead of the default '__webpack_public_path__'
 * This workaround removes the custom set publicPath from Calypso build until a long term solution is fixed.
 *
 * @param {object} config - the configuration file we're checking and editing.
 * @todo remove once we switch away from Calypso Build, or if this is addressed later.
 */
function overrideCalypsoBuildFileConfig( config ) {
	config.module.rules.forEach( v => {
		if ( v.type === 'asset/resource' ) {
			delete v.generator.publicPath;
		}
	} );
}
overrideCalypsoBuildFileConfig( extensionsWebpackConfig );
overrideCalypsoBuildFileConfig( componentsWebpackConfig );

// We export two configuration files: One for admin.js, and one for components.jsx.
// The latter produces pre-rendered components HTML.
module.exports = [
	{
		...extensionsWebpackConfig,
		resolve: {
			...extensionsWebpackConfig.resolve,
			// We want the compiled version, not the "calypso:src" sources.
			mainFields: extensionsWebpackConfig.resolve.mainFields.filter(
				entry => 'calypso:src' !== entry
			),
		},
		plugins: [
			...extensionsWebpackConfig.plugins,
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
		...componentsWebpackConfig,
		resolve: {
			...componentsWebpackConfig.resolve,
			// We want the compiled version, not the "calypso:src" sources.
			mainFields: componentsWebpackConfig.resolve.mainFields.filter(
				entry => 'calypso:src' !== entry
			),
		},
		plugins: [
			...componentsWebpackConfig.plugins,
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
						init: _.noop,
						prototype: {},
					},
					document: new jsdom.JSDOM().window.document,
					navigator: {},
					window: {
						addEventListener: _.noop,
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
						removeEventListener: _.noop,
						URL: {},
					},
					CSS: {
						supports: () => false,
					},
				},
			} ),
		],
	},
];
