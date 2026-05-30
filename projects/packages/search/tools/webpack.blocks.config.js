const fs = require( 'fs' );
const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

const blocksSrcDir = path.join( __dirname, '../src/search-blocks/blocks' );

/**
 * Build a webpack entry map for each block's `view.js`, keyed by block directory name.
 *
 * @return {Object<string, string>} Entry map for webpack.
 */
function readBlockViewEntries() {
	if ( ! fs.existsSync( blocksSrcDir ) ) {
		return {};
	}
	return fs
		.readdirSync( blocksSrcDir, { withFileTypes: true } )
		.filter( dirent => dirent.isDirectory() )
		.reduce( ( acc, dirent ) => {
			const viewPath = path.join( blocksSrcDir, dirent.name, 'view.js' );
			if ( fs.existsSync( viewPath ) ) {
				acc[ dirent.name ] = viewPath;
			}
			return acc;
		}, {} );
}

const blockViewEntries = readBlockViewEntries();

// The shared store is emitted as its own ESM bundle and registered as the
// `jetpack-search/store` WordPress Script Module. Every block `view.js`
// imports that bare specifier; DependencyExtractionPlugin externalizes it
// (see `requestToExternalModule` below) so the store ships once instead of
// being inlined into all ~14 view bundles.
const STORE_MODULE_ID = 'jetpack-search/store';
const storeIndexPath = path.join( __dirname, '../src/search-blocks/store/index.js' );
const storeEntries = fs.existsSync( storeIndexPath ) ? { 'store/index': storeIndexPath } : {};

// Standalone overlay-bootstrap entry. Wires theme search triggers to the
// server-rendered Search blocks overlay; opt-in feature, not part of any block.
const overlayBootstrapPath = path.join(
	__dirname,
	'../src/search-blocks/overlay-bootstrap/index.js'
);
const overlayBootstrapEntries = fs.existsSync( overlayBootstrapPath )
	? { 'overlay-bootstrap/index': overlayBootstrapPath }
	: {};

module.exports = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	entry: {
		...storeEntries,
		...overlayBootstrapEntries,
		...blockViewEntries,
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '../build/search-blocks' ),
		module: true,
		chunkFormat: 'module',
		environment: { module: true },
		library: { type: 'module' },
		filename: '[name].js',
	},
	experiments: {
		outputModule: true,
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
		alias: {
			...jetpackWebpackConfig.resolve.alias,
			// Lets the `store/index` entry (and Jest, via moduleNameMapper)
			// resolve the same bare specifier the view bundles import.
			// In the view bundles DependencyExtractionPlugin intercepts it
			// first and externalizes it, so this alias never inlines it there.
			[ STORE_MODULE_ID ]: storeIndexPath,
		},
		modules: [
			path.resolve( __dirname, '../src/search-blocks' ),
			'node_modules',
			path.resolve( __dirname, '../node_modules' ),
		],
	},
	module: {
		strictExportPresence: true,
		rules: [
			jetpackWebpackConfig.TranspileRule( { exclude: /node_modules\// } ),
			jetpackWebpackConfig.TranspileRule( { includeNodeModules: [ '@automattic/jetpack-' ] } ),
			jetpackWebpackConfig.CssRule( {
				extensions: [ 'css', 'sass', 'scss' ],
				extraLoaders: [
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: { config: path.join( __dirname, '../postcss.blocks.config.js' ) },
						},
					},
					{ loader: 'sass-loader', options: { api: 'modern-compiler' } },
				],
			} ),
			jetpackWebpackConfig.FileRule(),
		],
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: {
				injectPolyfill: false,
				// Keep the shared store out of every view bundle: emit a
				// static `import 'jetpack-search/store'` and let WordPress
				// resolve it to the registered Script Module. The `module `
				// prefix forces webpack's ESM external type for this request
				// (DEWP otherwise defaults externals to `import`, which turns
				// a binding-less side-effect import into an async `import()`
				// and a forbidden top-level await — `validate-es` rejects it).
				// Returning undefined for everything else preserves the
				// default `@wordpress/*` externalization (useDefaults stays on).
				requestToExternalModule( request ) {
					if ( request === STORE_MODULE_ID ) {
						return `module ${ STORE_MODULE_ID }`;
					}
				},
			},
			// I18nLoaderPlugin tries to inject @wordpress/jp-i18n-loader as an
			// import, which isn't supported by the DependencyExtractionPlugin
			// in ESM/module output mode. Disable for this build.
			I18nLoaderPlugin: false,
		} ),
	],
};
