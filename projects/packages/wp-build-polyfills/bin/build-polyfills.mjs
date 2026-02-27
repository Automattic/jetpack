#!/usr/bin/env node

/**
 * Build script for Core package polyfills.
 *
 * Bundles `@wordpress` packages that are not available in WordPress Core < 7.0
 * (private-apis, theme, boot, route, a11y) so that plugins using
 * wp-build can conditionally register them when Core/Gutenberg doesn't provide them.
 *
 * Uses the same externals strategy as wp-build's wordpress-externals-plugin:
 * - Classic scripts (IIFE): `@wordpress/*` → window.wp.{camelCase}, vendor → globals
 * - Script modules (ESM): `@wordpress/*` script modules → external (import map),
 * `@wordpress/*` classic-only → window.wp.{camelCase}, vendor → globals
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';
import { build } from 'esbuild';

// Resolve packages from this package's own node_modules, not the consumer's.
const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const packageRoot = path.resolve( __dirname, '..' );
const require = createRequire( path.join( packageRoot, 'package.json' ) );

// Parse CLI arguments.
const { values: args } = parseArgs( {
	options: {
		'output-dir': { type: 'string', default: 'build/polyfills' },
	},
	strict: false,
} );

const outputBase = path.resolve( args[ 'output-dir' ] );

// ── Vendor externals (same as wp-build) ──────────────────────────────────────

const vendorExternals = {
	react: { global: 'React', handle: 'react' },
	'react-dom': { global: 'ReactDOM', handle: 'react-dom' },
	'react/jsx-runtime': {
		global: 'ReactJSXRuntime',
		handle: 'react-jsx-runtime',
	},
	'react/jsx-dev-runtime': {
		global: 'ReactJSXRuntime',
		handle: 'react-jsx-runtime',
	},
	moment: { global: 'moment', handle: 'moment' },
	lodash: { global: 'lodash', handle: 'lodash' },
	'lodash-es': { global: 'lodash', handle: 'lodash' },
	jquery: { global: 'jQuery', handle: 'jquery' },
};

// ── Package info cache ───────────────────────────────────────────────────────

const packageJsonCache = new Map();

/**
 * Get the package JSON for a package.
 * @param {string} packageName - The package name.
 * @param {string} resolveDir  - The directory to resolve the package from.
 * @return {object} The package JSON.
 */
function getPackageJson( packageName, resolveDir = null ) {
	const contextDir = resolveDir || packageRoot;
	const cacheKey = `${ packageName }@${ contextDir }`;

	if ( packageJsonCache.has( cacheKey ) ) {
		return packageJsonCache.get( cacheKey );
	}

	try {
		const contextRequire = createRequire( path.join( contextDir, 'package.json' ) );

		const pkgPath = contextRequire.resolve( `${ packageName }/package.json` );

		const pkg = JSON.parse( readFileSync( pkgPath, 'utf8' ) );
		packageJsonCache.set( cacheKey, pkg );

		return pkg;
	} catch {
		packageJsonCache.set( cacheKey, null );

		return null;
	}
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert a string to camel case.
 *
 * @param {string} str - The string to convert.
 * @return {string} The camel case string.
 */
function camelCase( str ) {
	return str.replace( /-([a-z])/g, ( _, c ) => c.toUpperCase() );
}

/**
 * Check if a subpath is a script module import.
 * @param {object} packageJson - The package JSON object.
 * @param {string} subpath     - The subpath to check.
 * @return {boolean} Whether the subpath is a script module import.
 */
function isScriptModuleImport( packageJson, subpath ) {
	const { wpScriptModuleExports } = packageJson;

	if ( ! wpScriptModuleExports ) {
		return false;
	}

	if ( ! subpath ) {
		if ( typeof wpScriptModuleExports === 'string' ) {
			return true;
		}

		if ( typeof wpScriptModuleExports === 'object' && wpScriptModuleExports[ '.' ] ) {
			return true;
		}

		return false;
	}

	if ( typeof wpScriptModuleExports === 'object' && wpScriptModuleExports[ `./${ subpath }` ] ) {
		return true;
	}

	return false;
}

/**
 * Generate a SHA-256 hash of the content.
 * @param {string} content - The content to hash.
 * @return {string} The SHA-256 hash.
 */
function generateContentHash( content ) {
	return createHash( 'sha256' ).update( content ).digest( 'hex' ).slice( 0, 20 );
}

// ── Externals plugin ─────────────────────────────────────────────────────────

/**
 * Create an externals plugin for the polyfills.
 * @param {string} buildFormat - The build format.
 * @param {string} skipPackage - The package to skip.
 * @return {object} The externals plugin.
 */
function polyfillExternalsPlugin( buildFormat, skipPackage = null ) {
	const dependencies = new Set();
	const moduleDependencies = new Map();

	return {
		name: 'polyfill-externals',
		setup( esb ) {
			// Vendor externals
			for ( const [ packageName, config ] of Object.entries( vendorExternals ) ) {
				esb.onResolve( { filter: new RegExp( `^${ packageName }$` ) }, onResolveArgs => {
					dependencies.add( config.handle );

					return {
						path: onResolveArgs.path,
						namespace: 'vendor-external',
						pluginData: { global: config.global },
					};
				} );
			}

			// @wordpress/* externals
			esb.onResolve( { filter: /^@wordpress\// }, onResolveArgs => {
				const parts = onResolveArgs.path.split( '/' );
				const packageName = parts.slice( 0, 2 ).join( '/' );
				const subpath = parts.length > 2 ? parts.slice( 2 ).join( '/' ) : null;
				const shortName = parts[ 1 ];
				const handle = `wp-${ shortName }`;

				// Don't externalize the package we're building
				if ( skipPackage && packageName === skipPackage ) {
					return undefined;
				}

				const packageJson = getPackageJson( packageName, onResolveArgs.resolveDir );

				if ( ! packageJson ) {
					return undefined;
				}

				let isScriptModule = isScriptModuleImport( packageJson, subpath );
				let isScript = !! packageJson.wpScript;

				// Dual packages: use the format being built
				if ( isScriptModule && isScript ) {
					isScript = buildFormat === 'iife';
					isScriptModule = buildFormat === 'esm';
				}

				const kind = onResolveArgs.kind === 'dynamic-import' ? 'dynamic' : 'static';

				if ( isScriptModule ) {
					if ( kind === 'static' ) {
						moduleDependencies.set( onResolveArgs.path, 'static' );
					} else if ( ! moduleDependencies.has( onResolveArgs.path ) ) {
						moduleDependencies.set( onResolveArgs.path, 'dynamic' );
					}

					return {
						path: onResolveArgs.path,
						external: true,
						sideEffects: !! packageJson.sideEffects,
					};
				}

				if ( isScript ) {
					dependencies.add( handle );

					return {
						path: onResolveArgs.path,
						namespace: 'package-external',
						pluginData: { globalName: 'wp' },
					};
				}

				// Not a registered script or module — let esbuild bundle it
				return undefined;
			} );

			esb.onLoad( { filter: /.*/, namespace: 'vendor-external' }, onLoadArgs => ( {
				contents: `module.exports = window.${ onLoadArgs.pluginData.global };`,
				loader: 'js',
			} ) );

			esb.onLoad( { filter: /.*/, namespace: 'package-external' }, onLoadArgs => {
				const packagePath = onLoadArgs.path.split( '/' ).slice( 1 ).join( '/' );
				const name = camelCase( packagePath );

				return {
					contents: `module.exports = window.${ onLoadArgs.pluginData.globalName }.${ name };`,
					loader: 'js',
				};
			} );

			// Generate asset file on build end
			esb.onEnd( result => {
				if ( result.errors.length > 0 ) {
					return;
				}

				const outfile = esb.initialOptions.outfile;
				const outputDir = path.dirname( outfile );
				const baseName = path.basename( outfile, '.js' );

				// Read the output to hash it
				const outputContent = readFileSync( outfile );
				const version = generateContentHash( outputContent );

				const sortedDeps = Array.from( dependencies ).sort();
				const depsString = sortedDeps.map( d => `'${ d }'` ).join( ', ' );

				const assetParts = [ `'dependencies' => array(${ depsString })` ];

				if ( moduleDependencies.size > 0 ) {
					const modDeps = Array.from( moduleDependencies.entries() )
						.sort( ( [ a ], [ b ] ) => a.localeCompare( b ) )
						.map( ( [ dep, impKind ] ) => `array('id' => '${ dep }', 'import' => '${ impKind }')` )
						.join( ', ' );

					assetParts.push( `'module_dependencies' => array(${ modDeps })` );
				}

				assetParts.push( `'version' => '${ version }'` );

				const assetContent = `<?php return array(${ assetParts.join( ', ' ) });`;

				const assetPath = path.join( outputDir, `${ baseName }.asset.php` );

				mkdirSync( outputDir, { recursive: true } );
				writeFileSync( assetPath, assetContent );
			} );
		},
	};
}

// ── Polyfill definitions ─────────────────────────────────────────────────────

// Some packages (e.g. @wordpress/boot) only export ESM — no `require` or `default`
// condition — so CJS require.resolve() fails. Resolve via /package.json (universally
// exported) and read the `module` or `main` field instead.
/**
 * Resolve the entry point for a package.
 * @param {string} packageName - The package name.
 * @param {string} subEntry    - The subentry to resolve.
 * @return {string} The entry point.
 */
function resolvePackageEntry( packageName, subEntry = null ) {
	const pkgJsonPath = require.resolve( `${ packageName }/package.json` );
	const pkgDir = path.dirname( pkgJsonPath );

	if ( subEntry ) {
		return path.join( pkgDir, subEntry );
	}

	const pkg = JSON.parse( readFileSync( pkgJsonPath, 'utf8' ) );

	return path.join( pkgDir, pkg.module || pkg.main );
}

const classicScriptPolyfills = [
	{
		name: 'private-apis',
		packageName: '@wordpress/private-apis',
		globalName: 'wp.privateApis',
		entry: resolvePackageEntry( '@wordpress/private-apis' ),
	},
	{
		name: 'theme',
		packageName: '@wordpress/theme',
		globalName: 'wp.theme',
		entry: resolvePackageEntry( '@wordpress/theme' ),
	},
];

const scriptModulePolyfills = [
	{
		name: 'boot',
		packageName: '@wordpress/boot',
		entry: resolvePackageEntry( '@wordpress/boot' ),
	},
	{
		name: 'route',
		packageName: '@wordpress/route',
		entry: resolvePackageEntry( '@wordpress/route' ),
	},
	{
		name: 'a11y',
		packageName: '@wordpress/a11y',
		// a11y's wpScriptModuleExports points to a separate module entry.
		entry: resolvePackageEntry( '@wordpress/a11y', 'build-module/module/index.mjs' ),
	},
];

// ── Build ────────────────────────────────────────────────────────────────────

const target = [ 'es2020' ];
const builds = [];

for ( const polyfill of classicScriptPolyfills ) {
	const outputDir = path.join( outputBase, 'scripts', polyfill.name );

	// Minified
	builds.push(
		build( {
			entryPoints: [ polyfill.entry ],
			outfile: path.join( outputDir, 'index.min.js' ),
			bundle: true,
			format: 'iife',
			globalName: polyfill.globalName,
			target,
			platform: 'browser',
			minify: true,
			sourcemap: true,
			plugins: [ polyfillExternalsPlugin( 'iife', polyfill.packageName ) ],
		} )
	);

	// Non-minified
	builds.push(
		build( {
			entryPoints: [ polyfill.entry ],
			outfile: path.join( outputDir, 'index.js' ),
			bundle: true,
			format: 'iife',
			globalName: polyfill.globalName,
			target,
			platform: 'browser',
			minify: false,
			sourcemap: true,
			plugins: [ polyfillExternalsPlugin( 'iife', polyfill.packageName ) ],
		} )
	);
}

for ( const polyfill of scriptModulePolyfills ) {
	const outputDir = path.join( outputBase, 'modules', polyfill.name );

	const entryPoint = polyfill.entry;

	// Minified
	builds.push(
		build( {
			entryPoints: [ entryPoint ],
			outfile: path.join( outputDir, 'index.min.js' ),
			bundle: true,
			format: 'esm',
			target,
			platform: 'browser',
			minify: true,
			sourcemap: true,
			plugins: [ polyfillExternalsPlugin( 'esm', polyfill.packageName ) ],
		} )
	);

	// Non-minified
	builds.push(
		build( {
			entryPoints: [ entryPoint ],
			outfile: path.join( outputDir, 'index.js' ),
			bundle: true,
			format: 'esm',
			target,
			platform: 'browser',
			minify: false,
			sourcemap: true,
			plugins: [ polyfillExternalsPlugin( 'esm', polyfill.packageName ) ],
		} )
	);
}

await Promise.all( builds );
// eslint-disable-next-line no-console
console.log( 'WP Build Polyfills: Polyfill builds complete.' );
