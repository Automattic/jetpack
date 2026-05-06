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

// Also include the shared store module so it can be imported by view.js files.
const storeIndexPath = path.join( __dirname, '../src/search-blocks/store/index.js' );
const storeEntries = fs.existsSync( storeIndexPath ) ? { 'store/index': storeIndexPath } : {};

// The i18n shim is the runtime the `@wordpress/i18n` import resolves to in the
// IAPI module bundle (see `requestToExternalModule` below). It re-exports
// `window.wp.i18n` so the front-end view bundle can use `__()` / `_n()` /
// `sprintf()` natively, with translations seeded by the inline `setLocaleData`
// call emitted in `Search_Blocks::enqueue_i18n_runtime()`.
const i18nShimPath = path.join( __dirname, '../src/search-blocks/store/i18n-shim.js' );
const i18nShimEntry = fs.existsSync( i18nShimPath ) ? { 'store/i18n-shim': i18nShimPath } : {};

module.exports = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	entry: {
		...storeEntries,
		...i18nShimEntry,
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
							postcssOptions: { config: path.join( __dirname, '../postcss.config.js' ) },
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
				// Externalize `@wordpress/i18n` to a script-module reference so
				// view bundles can `import { __, _n, sprintf } from '@wordpress/i18n'`
				// natively. The `@wordpress/i18n` script module is registered
				// by `Search_Blocks::register_i18n_module()` and points to
				// `store/i18n-shim.js`, which re-exports `window.wp.i18n`.
				// Without this, DEP's default `requestToExternalModule` throws
				// "Attempted to use WordPress script in a module" because core
				// only registers `@wordpress/interactivity` (and a11y / router)
				// as script modules today.
				requestToExternalModule( request ) {
					if ( request !== '@wordpress/i18n' ) {
						// Returning undefined here lets DEP fall through to its
						// own defaults for every other `@wordpress/*` request,
						// which is what we want — only `@wordpress/i18n` needs
						// our custom module-mode handling today.
						return;
					}
					// `module` (not `import`) so webpack emits a hoisted
					// static `import * from '@wordpress/i18n'` instead of
					// a dynamic `import()` Promise. Same pattern DEP uses
					// for `@wordpress/interactivity` itself: we need
					// synchronous bindings for `__()` / `_n()` / `sprintf()`
					// calls in the view bundle's pure helpers.
					return 'module @wordpress/i18n';
				},
			},
			// I18nLoaderPlugin tries to inject @wordpress/jp-i18n-loader as an
			// import, which isn't supported by the DependencyExtractionPlugin
			// in ESM/module output mode. Disable for this build.
			I18nLoaderPlugin: false,
		} ),
	],
};
