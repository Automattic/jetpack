/**
 *WARNING: No ES6 modules here. Not transpiled! ****
 */

/**
 * External dependencies
 */
const fs = require( 'fs' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const CopyBlockEditorAssetsPlugin = require( './copy-block-editor-assets' );

/**
 * Internal variables
 */
const editorSetup = path.join( __dirname, '../extensions', 'editor' );
const viewSetup = path.join( __dirname, '../extensions', 'view' );
const blockEditorDirectories = [ 'plugins', 'blocks' ];

/**
 * Filters block editor scripts
 *
 * @param {string} type - script type
 * @param {string} inputDir - input directory
 * @param {Array} presetBlocks - preset blocks
 * @returns {Array} list of block scripts
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
							postcssOptions: { config: path.join( __dirname, '../postcss.config.js' ) },
						},
					},
					'sass-loader',
				],
			} ),

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
			editor: editorScript,
			'editor-experimental': editorExperimentalScript,
			'editor-beta': editorBetaScript,
			'editor-no-post-editor': editorNoPostEditorScript,
			// this entry is added to generate components.css which is enqueued at
			// https://github.com/Automattic/jetpack/blob/0e8a2c9ab438c8213fa4863220ccc342ea13cf42/projects/plugins/jetpack/_inc/lib/components.php#L24
			components: path.join( __dirname, '../extensions/shared/components/upgrade-nudge/index.jsx' ),
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
];
