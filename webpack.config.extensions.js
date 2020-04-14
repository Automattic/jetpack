/**
 **** WARNING: No ES6 modules here. Not transpiled! ****
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

/**
 * Internal dependencies
 */
// const { workerCount } = require( './webpack.common' ); // todo: shard...

/**
 * Internal variables
 */
const editorSetup = path.join( __dirname, 'extensions', 'editor' );
const viewSetup = path.join( __dirname, 'extensions', 'view' );

function blockScripts( type, inputDir, presetBlocks ) {
	return presetBlocks
		.map( block => path.join( inputDir, 'blocks', block, `${ type }.js` ) )
		.filter( fs.existsSync );
}

const presetPath = path.join( __dirname, 'extensions', 'index.json' );
const presetIndex = require( presetPath );
const presetProductionBlocks = _.get( presetIndex, [ 'production' ], [] );
const presetExperimentalBlocks = [
	...presetProductionBlocks,
	..._.get( presetIndex, [ 'experimental' ], [] ),
];
// Beta Blocks include all blocks: beta, experimental, and production blocks.
const presetBetaBlocks = [ ...presetExperimentalBlocks, ..._.get( presetIndex, [ 'beta' ], [] ) ];

// Helps split up each block into its own folder view script
const viewBlocksScripts = presetBetaBlocks.reduce( ( viewBlocks, block ) => {
	const viewScriptPath = path.join( __dirname, 'extensions', 'blocks', block, 'view.js' );
	if ( fs.existsSync( viewScriptPath ) ) {
		viewBlocks[ block + '/view' ] = [ viewSetup, ...[ viewScriptPath ] ];
	}
	return viewBlocks;
}, {} );

// Combines all the different production blocks into one editor.js script
const editorScript = [
	editorSetup,
	...blockScripts( 'editor', path.join( __dirname, 'extensions' ), presetProductionBlocks ),
];

// Combines all the different Experimental blocks into one editor.js script
const editorExperimentalScript = [
	editorSetup,
	...blockScripts( 'editor', path.join( __dirname, 'extensions' ), presetExperimentalBlocks ),
];

// Combines all the different blocks into one editor-beta.js script
const editorBetaScript = [
	editorSetup,
	...blockScripts( 'editor', path.join( __dirname, 'extensions' ), presetBetaBlocks ),
];

const extensionsWebpackConfig = getBaseWebpackConfig(
	{ WP: true },
	{
		entry: {
			editor: editorScript,
			'editor-experimental': editorExperimentalScript,
			'editor-beta': editorBetaScript,
			...viewBlocksScripts,
		},
		'output-chunk-filename': '[name].[chunkhash].js',
		'output-path': path.join( __dirname, '_inc', 'blocks' ),
	}
);

const transpileConfig = extensionsWebpackConfig.module.rules.find( rule =>
	rule.use.some( loader => loader.options.presets )
);

const componentsWebpackConfig = getBaseWebpackConfig(
	{ WP: false },
	{
		entry: {
			components: path.join( __dirname, './extensions/shared/components/index.jsx' ),
		},
		'output-chunk-filename': '[name].[chunkhash].js',
		'output-library-target': 'commonjs2',
		'output-path': path.join( __dirname, '_inc', 'blocks' ),
		'output-pathinfo': true,
	}
);

// We export two configuration files: One for admin.js, and one for components.jsx.
// The latter produces pre-rendered components HTML.
module.exports = [
	{
		...extensionsWebpackConfig,
		resolve: {
			...extensionsWebpackConfig.resolve,
			modules: [ path.resolve( __dirname, '_inc/client' ), 'node_modules' ],
		},
		// The `module` override fixes https://github.com/Automattic/jetpack/issues/12511.
		// @TODO Remove once there's a fix in `@automattic/calypso-build`
		module: {
			...extensionsWebpackConfig.module,
			rules: [
				{ ...transpileConfig, exclude: /node_modules\/(?!punycode)/ },
				..._.without( extensionsWebpackConfig.module.rules, transpileConfig ),
			],
		},
		plugins: [
			...extensionsWebpackConfig.plugins,
			new CopyWebpackPlugin( [
				{
					from: presetPath,
					to: 'index.json',
				},
			] ),
		],
	},
	{
		...componentsWebpackConfig,
		resolve: {
			...componentsWebpackConfig.resolve,
			modules: [ path.resolve( __dirname, '_inc/client' ), 'node_modules' ],
		},
		plugins: [
			...componentsWebpackConfig.plugins,
			new webpack.NormalModuleReplacementPlugin(
				/^@wordpress\/i18n$/,
				path.join( __dirname, './extensions/shared/i18n-to-php' )
			),
			new StaticSiteGeneratorPlugin( {
				// The following mocks are required to make `@wordpress/` npm imports work with server-side rendering.
				// Hopefully, most of them can be dropped once https://github.com/WordPress/gutenberg/pull/16227 lands.
				globals: {
					Mousetrap: {
						init: _.noop,
						prototype: {},
					},
					document: {
						addEventListener: _.noop,
						createElement: _.noop,
						head: { appendChild: _.noop },
					},
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
						URL: {},
					},
				},
			} ),
		],
	},
];
