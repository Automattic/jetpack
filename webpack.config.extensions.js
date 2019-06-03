/**
 **** WARNING: No ES6 modules here. Not transpiled! ****
 */
/* eslint-disable import/no-nodejs-modules, lodash/import-scope */

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
const presetBlocks = _.get( presetIndex, [ 'production' ], [] );
const presetBetaBlocks = _.get( presetIndex, [ 'beta' ], [] );
const allPresetBlocks = [ ...presetBlocks, ...presetBetaBlocks ];

// Helps split up each block into its own folder view script
const viewBlocksScripts = allPresetBlocks.reduce( ( viewBlocks, block ) => {
	const viewScriptPath = path.join( __dirname, 'extensions', 'blocks', block, 'view.js' );
	if ( fs.existsSync( viewScriptPath ) ) {
		viewBlocks[ block + '/view' ] = [ viewSetup, ...[ viewScriptPath ] ];
	}
	return viewBlocks;
}, {} );

// Combines all the different blocks into one editor.js script
const editorScript = [
	editorSetup,
	...blockScripts( 'editor', path.join( __dirname, 'extensions' ), presetBlocks ),
];

// Combines all the different blocks into one editor-beta.js script
const editorBetaScript = [
	editorSetup,
	...blockScripts( 'editor', path.join( __dirname, 'extensions' ), allPresetBlocks ),
];

const webpackConfig = getBaseWebpackConfig(
	{ WP: true },
	{
		entry: {
			editor: editorScript,
			'editor-beta': editorBetaScript,
			...viewBlocksScripts,
		},
		'output-chunk-filename': '[name].[chunkhash].js',
		'output-path': path.join( __dirname, '_inc', 'blocks' ),
	}
);

const transpileConfig = webpackConfig.module.rules.find( rule =>
	rule.use.some( loader => loader.options.presets )
);

module.exports = {
	...webpackConfig,
	// The `module` override fixes https://github.com/Automattic/jetpack/issues/12511.
	// @TODO Remove once there's a fix in `@automattic/calypso-build`
	module: {
		...webpackConfig.module,
		rules: [
			{ ...transpileConfig, exclude: /node_modules\/(?!punycode)/ },
			..._.without( webpackConfig.module.rules, transpileConfig ),
		],
	},
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
