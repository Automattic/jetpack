/**
 * Webpack configuration for wp-build-polyfills.
 *
 * Bundles `@wordpress` packages not available in WordPress Core < 7.0
 * as both classic scripts (IIFE) and script modules (ESM).
 *
 * IIFE builds use `@wordpress/dependency-extraction-webpack-plugin` (via
 * jetpack-webpack-config's StandardPlugins) for externals and .asset.php.
 *
 * ESM builds use a custom PolyfillModulePlugin because the dep extraction
 * plugin doesn't support hybrid externals — ESM modules that import both
 * script modules (externalized as `import \@wordpress/route`) and classic
 * scripts (externalized as `var wp.notices` window globals).
 */

const { readFileSync } = require( 'fs' );
const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

const packageRoot = __dirname;
const localRequire = require;

const outputBase = path.join( packageRoot, 'build' );

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert a dash-separated string to camelCase.
 *
 * @param {string} str - Input string.
 * @return {string} camelCased string.
 */
function camelCaseDash( str ) {
	return str.replace( /-([a-z])/g, ( _, c ) => c.toUpperCase() );
}

const pkgJsonCache = new Map();

/**
 * Read and cache a package's package.json.
 *
 * @param {string} packageName - npm package name.
 * @return {object|null} Parsed package.json or null.
 */
function readPackageJson( packageName ) {
	if ( pkgJsonCache.has( packageName ) ) {
		return pkgJsonCache.get( packageName );
	}
	try {
		const pkgPath = localRequire.resolve( `${ packageName }/package.json` );
		const pkg = JSON.parse( readFileSync( pkgPath, 'utf8' ) );
		pkgJsonCache.set( packageName, pkg );
		return pkg;
	} catch {
		pkgJsonCache.set( packageName, null );
		return null;
	}
}

/**
 * Check if a package exports a WordPress script module (default export).
 *
 * @param {object} pkg - Parsed package.json.
 * @return {boolean} True if the package has wpScriptModuleExports for '.'.
 */
function hasScriptModuleExport( pkg ) {
	if ( ! pkg?.wpScriptModuleExports ) {
		return false;
	}
	const exports = pkg.wpScriptModuleExports;
	return typeof exports === 'string' || ( typeof exports === 'object' && exports[ '.' ] );
}

/**
 * Resolve the entry point for a package.
 *
 * Some packages (e.g. `@wordpress/boot`) only export ESM, so CJS
 * require.resolve() fails. We resolve via package.json instead and
 * read the `module` or `main` field.
 *
 * @param {string}      packageName - npm package name.
 * @param {string|null} subEntry    - Optional sub-entry relative to package root.
 * @return {string} Absolute path to the entry file.
 */
function resolveEntry( packageName, subEntry = null ) {
	const pkgPath = localRequire.resolve( `${ packageName }/package.json` );
	const pkgDir = path.dirname( pkgPath );
	if ( subEntry ) {
		return path.join( pkgDir, subEntry );
	}
	const pkg = JSON.parse( readFileSync( pkgPath, 'utf8' ) );
	return path.join( pkgDir, pkg.module || pkg.main );
}

// ── Shared config ───────────────────────────────────────────────────────────

const sharedConfig = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
		modules: [ path.join( packageRoot, 'node_modules' ), 'node_modules' ],
	},
	module: {
		rules: [
			// Transpile @wordpress/* packages from node_modules.
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@wordpress/' ],
			} ),
		],
	},
};

// Plugins disabled for all polyfill builds: no CSS is bundled, and i18n is
// handled by core's textdomain since @wordpress/i18n remains external.
const disabledPlugins = {
	MiniCssExtractPlugin: false,
	MiniCssWithRtlPlugin: false,
	WebpackRtlPlugin: false,
	I18nLoaderPlugin: false,
	I18nCheckPlugin: false,
};

// ── Polyfill definitions ────────────────────────────────────────────────────

const classicPolyfills = [
	{
		name: 'notices',
		packageName: '@wordpress/notices',
		library: [ 'wp', 'notices' ],
	},
	{
		name: 'private-apis',
		packageName: '@wordpress/private-apis',
		library: [ 'wp', 'privateApis' ],
	},
	{
		name: 'theme',
		packageName: '@wordpress/theme',
		library: [ 'wp', 'theme' ],
	},
];

const modulePolyfills = [
	{ name: 'boot', packageName: '@wordpress/boot' },
	{ name: 'route', packageName: '@wordpress/route' },
	{
		name: 'a11y',
		packageName: '@wordpress/a11y',
		// a11y's wpScriptModuleExports points to a separate module entry.
		subEntry: 'build-module/module/index.mjs',
	},
];

// ── IIFE configs (classic scripts) ──────────────────────────────────────────
//
// Uses @wordpress/dependency-extraction-webpack-plugin (via StandardPlugins)
// for externals handling and .asset.php generation. The requestMap prevents
// externalization of the package being polyfilled so webpack bundles it.

const iifeConfigs = classicPolyfills.map( polyfill => ( {
	name: `script-${ polyfill.name }`,
	...sharedConfig,
	entry: {
		index: resolveEntry( polyfill.packageName ),
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( outputBase, 'scripts', polyfill.name ),
		library: {
			name: polyfill.library,
			type: 'window',
		},
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: {
				requestMap: {
					[ polyfill.packageName ]: { external: false },
				},
			},
			...disabledPlugins,
		} ),
	],
} ) );

// ── PolyfillModulePlugin ────────────────────────────────────────────────────
//
// Custom webpack plugin for ESM polyfill builds. Handles:
//   1. Externals via webpack.ExternalsPlugin — script module deps become
//      `import @wordpress/xxx`, classic-only deps become `var wp.xxx`.
//   2. Dependency tracking — separates classic script handles (dependencies)
//      from module IDs (module_dependencies).
//   3. Asset generation — writes .asset.php in the same format as
//      @wordpress/dependency-extraction-webpack-plugin.

// Vendor externals (same mapping as @wordpress/dependency-extraction-webpack-plugin).
const VENDOR_EXTERNALS = {
	react: { global: 'React', handle: 'react' },
	'react-dom': { global: 'ReactDOM', handle: 'react-dom' },
	'react/jsx-runtime': { global: 'ReactJSXRuntime', handle: 'react-jsx-runtime' },
	'react/jsx-dev-runtime': { global: 'ReactJSXRuntime', handle: 'react-jsx-runtime' },
	moment: { global: 'moment', handle: 'moment' },
	lodash: { global: 'lodash', handle: 'lodash' },
	'lodash-es': { global: 'lodash', handle: 'lodash' },
	jquery: { global: 'jQuery', handle: 'jquery' },
};

class PolyfillModulePlugin {
	constructor( { skipPackage } ) {
		this.skipPackage = skipPackage;
	}

	apply( compiler ) {
		const { webpack } = compiler;
		const { RawSource } = webpack.sources;

		const scriptDeps = new Set();
		const moduleDeps = new Map();

		// Register externals.
		new webpack.ExternalsPlugin( 'import', ( { request }, callback ) => {
			// Don't externalize the package being polyfilled.
			if ( request === this.skipPackage || request.startsWith( this.skipPackage + '/' ) ) {
				return callback();
			}

			// @wordpress/* packages.
			if ( request.startsWith( '@wordpress/' ) ) {
				const pkgName = request.split( '/' ).slice( 0, 2 ).join( '/' );
				const shortName = request.split( '/' )[ 1 ];
				const pkg = readPackageJson( pkgName );

				// Prefer script module for ESM builds.
				if ( pkg && hasScriptModuleExport( pkg ) ) {
					moduleDeps.set( request, 'static' );
					return callback( null, `import ${ request }` );
				}

				// Classic script (or unresolvable — default to classic since
				// most @wordpress/* packages are classic scripts).
				scriptDeps.add( `wp-${ shortName }` );
				return callback( null, `var wp.${ camelCaseDash( shortName ) }` );
			}

			// Vendor externals.
			const vendor = VENDOR_EXTERNALS[ request ];
			if ( vendor ) {
				scriptDeps.add( vendor.handle );
				return callback( null, `var ${ vendor.global }` );
			}

			// Unknown — let webpack bundle it.
			return callback();
		} ).apply( compiler );

		// Generate .asset.php files.
		compiler.hooks.thisCompilation.tap( 'PolyfillModulePlugin', compilation => {
			compilation.hooks.processAssets.tap(
				{
					name: 'PolyfillModulePlugin',
					stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ANALYSE,
				},
				() => {
					for ( const [ , entrypoint ] of compilation.entrypoints ) {
						for ( const chunk of entrypoint.chunks ) {
							const jsFile = Array.from( chunk.files ).find( f => /\.m?js$/i.test( f ) );
							if ( ! jsFile ) {
								continue;
							}

							const content = compilation.getAsset( jsFile ).source.buffer();
							const hash = webpack.util
								.createHash( 'xxhash64' )
								.update( content )
								.digest( 'hex' )
								.slice( 0, 16 );

							const depsPhp = Array.from( scriptDeps )
								.sort()
								.map( d => `'${ d }'` )
								.join( ', ' );
							const modDepsPhp = Array.from( moduleDeps.entries() )
								.sort( ( [ a ], [ b ] ) => a.localeCompare( b ) )
								.map( ( [ id, imp ] ) => `array('id' => '${ id }', 'import' => '${ imp }')` )
								.join( ', ' );

							const parts = [ `'dependencies' => array(${ depsPhp })` ];
							if ( moduleDeps.size > 0 ) {
								parts.push( `'module_dependencies' => array(${ modDepsPhp })` );
							}
							parts.push( `'version' => '${ hash }'` );

							const assetContent = `<?php return array(${ parts.join( ', ' ) });\n`;
							const assetFilename = jsFile.replace( /\.m?js$/i, '.asset.php' );

							compilation.emitAsset( assetFilename, new RawSource( assetContent ) );
							chunk.files.add( assetFilename );
						}
					}
				}
			);
		} );
	}
}

// ── ESM configs (script modules) ────────────────────────────────────────────

const esmConfigs = modulePolyfills.map( polyfill => ( {
	name: `module-${ polyfill.name }`,
	...sharedConfig,
	module: {
		rules: [
			...sharedConfig.module.rules,
			// Preserve native dynamic imports in @wordpress/boot so the
			// browser can resolve route module IDs via the import map.
			// Without this, webpack replaces `import(variable)` calls with
			// context-module stubs that always throw "Cannot find module".
			{
				test: /[\\/]@wordpress[\\/]boot[\\/]/,
				enforce: 'post',
				loader: path.resolve( packageRoot, 'preserve-dynamic-imports-loader.js' ),
			},
		],
	},
	entry: {
		index: resolveEntry( polyfill.packageName, polyfill.subEntry ),
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( outputBase, 'modules', polyfill.name ),
		module: true,
		chunkFormat: 'module',
		environment: { module: true },
		library: { type: 'module' },
	},
	experiments: {
		outputModule: true,
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: false,
			...disabledPlugins,
		} ),
		new PolyfillModulePlugin( { skipPackage: polyfill.packageName } ),
	],
} ) );

module.exports = [ ...iifeConfigs, ...esmConfigs ];
