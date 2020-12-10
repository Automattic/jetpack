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
const presetNoPostEditorBlocks = _.get( presetIndex, [ 'no-post-editor' ], [] );

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

const editorNoPostEditorScript = [
	editorSetup,
	...blockScripts( 'editor', path.join( __dirname, 'extensions' ), presetNoPostEditorBlocks ),
];

const webpackConfig = getBaseWebpackConfig(
	{ WP: true },
	{
		entry: {
			editor: editorScript,
			'editor-experimental': editorExperimentalScript,
			'editor-beta': editorBetaScript,
			'editor-no-post-editor': editorNoPostEditorScript,
			...viewBlocksScripts,
		},
		'output-chunk-filename': '[name].[chunkhash].js',
		'output-path': path.join( __dirname, '_inc', 'blocks' ),
	}
);

module.exports = {
	...webpackConfig,
	plugins: [
		...webpackConfig.plugins,
		new CopyWebpackPlugin( [
			{
				from: presetPath,
				to: 'index.json',
			},
		] ),
	],
};
