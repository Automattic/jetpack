/* global __dirname, process */
/**
 * Shared logic for the export-contract validator.
 *
 * Used by both the post-build CLI script and the test suite.
 *
 * WHY THIS EXISTS
 * ---------------
 * This package ships a *matched set* of `@wordpress/*` packages. Some of them
 * import symbols from others at runtime — most importantly `@wordpress/boot`
 * imports `ThemeProvider` from `@wordpress/theme`, `SnackbarNotices` from
 * `@wordpress/notices`, and so on. Those imported packages are shipped as
 * classic scripts that expose a `window.wp.<pkg>` global.
 *
 * If the versions get out of sync (e.g. boot expects a public `ThemeProvider`
 * export but the shipped `@wordpress/theme` only exposes it privately), the
 * symbol resolves to `undefined` at runtime → React error #130 → blank
 * dashboard, with NO build error and NO obvious console message. That is
 * exactly what shipped in Jetpack 16.0.
 *
 * The existing `validate-boot-asset` check verifies that dependency *handle
 * names* are known. It does NOT verify that the *symbols* one package imports
 * from another actually exist in the shipped version. This check closes that
 * gap: for every symbol a consumer package imports from a polyfilled provider
 * package, assert the provider's shipped public API actually exports it.
 *
 * Both sides are read from the packages' published ESM source
 * (`build-module/*.mjs`) — NOT from the webpack-built bundle — because the
 * built bundle mangles import identifiers under minification, while the source
 * `import { X } from '@wordpress/y'` / `export { X }` statements are stable.
 */

const { readFileSync, readdirSync, existsSync } = require( 'fs' );
const path = require( 'path' );

// Provider packages whose public exports we verify. Scoped to the CLASSIC
// SCRIPT polyfills (the `window.wp.<pkg>` globals) — this is the surface where
// a missing export silently resolves to `undefined` at runtime (the 16.0
// failure mode). Keep in sync with `classicPolyfills` in webpack.config.js and
// SCRIPT_HANDLES in src/class-wp-build-polyfills.php (asserted by a test).
//
// NOTE: the ESM module polyfills (@wordpress/route, @wordpress/a11y) are
// resolved via the browser import map rather than a window global, so they
// have a different (import-map) failure mode. Verifying them is a documented
// follow-up; see README "Export-contract validation".
const PROVIDER_PACKAGES = [
	'@wordpress/theme',
	'@wordpress/notices',
	'@wordpress/private-apis',
	'@wordpress/views',
];

// Consumer packages whose imports we scan. These are the ESM polyfills that
// compose the provider packages above. Keep in sync with `modulePolyfills` in
// webpack.config.js (asserted by a test).
const CONSUMER_PACKAGES = [ '@wordpress/boot', '@wordpress/route', '@wordpress/a11y' ];

/**
 * Extract the ORIGINAL names of the symbols named-imported from a specific
 * provider package in a chunk of ESM source.
 *
 * Handles `import { A, B as C } from '@wordpress/x'` (the imported name is the
 * token BEFORE `as`), across single- and multi-line import statements, single
 * or double quotes. Namespace (`import * as ns`) and default imports are
 * intentionally ignored: they cannot fail as a "missing named export".
 *
 * @param {string} source      - ESM source text.
 * @param {string} providerPkg - e.g. '@wordpress/theme'.
 * @return {string[]} Sorted, de-duplicated original imported symbol names.
 */
function parseNamedImports( source, providerPkg ) {
	const found = new Set();
	// Match `import { ... } from '<providerPkg>'` — the `{ ... }` may span lines.
	const escaped = providerPkg.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
	const re = new RegExp( `import\\s*\\{([^}]*)\\}\\s*from\\s*['"]${ escaped }['"]`, 'g' );
	let match;
	while ( ( match = re.exec( source ) ) !== null ) {
		for ( const specifier of match[ 1 ].split( ',' ) ) {
			const name = specifier
				.trim()
				.split( /\s+as\s+/ )[ 0 ]
				.trim();
			if ( name ) {
				found.add( name );
			}
		}
	}
	return [ ...found ].sort();
}

/**
 * Extract the PUBLIC export names from a provider package's built ESM index.
 *
 * Handles consolidated `export { A, default2 as B, store }` blocks and
 * re-export `export { A as B } from './x'` forms (the public name is the token
 * AFTER `as`). If the index uses a wildcard `export *`, the public surface
 * cannot be statically enumerated — the result is flagged `opaque` so callers
 * can skip (warn) rather than emit a false "missing export".
 *
 * @param {string} indexSource - Contents of the package's `module`/`main` entry.
 * @return {{ names: string[], opaque: boolean }} Public export names + opacity flag.
 */
function parsePublicExports( indexSource ) {
	const names = new Set();
	const opaque = /export\s*\*/.test( indexSource );

	const re = /export\s*\{([^}]*)\}/g;
	let match;
	while ( ( match = re.exec( indexSource ) ) !== null ) {
		for ( const specifier of match[ 1 ].split( ',' ) ) {
			const trimmed = specifier.trim();
			if ( ! trimmed ) {
				continue;
			}
			// `A as B` → public name is `B`; plain `A` → `A`.
			const parts = trimmed.split( /\s+as\s+/ );
			const name = parts[ parts.length - 1 ].trim();
			if ( name ) {
				names.add( name );
			}
		}
	}
	return { names: [ ...names ].sort(), opaque };
}

/**
 * Pure contract check for one (consumer → provider) pair.
 *
 * @param {object}   args          - The (consumer, provider) pair and its symbols.
 * @param {string}   args.consumer - Consumer package name (for messages).
 * @param {string}   args.provider - Provider package name (for messages).
 * @param {string[]} args.imported - Symbols the consumer imports from the provider.
 * @param {string[]} args.exported - Public export names of the provider.
 * @param {boolean}  [args.opaque] - True when the provider's exports can't be enumerated.
 * @return {{ ok: boolean, consumer: string, provider: string, missing: string[], skipped?: boolean }} The contract result.
 */
function checkContract( { consumer, provider, imported, exported, opaque = false } ) {
	if ( opaque ) {
		return { ok: true, consumer, provider, missing: [], skipped: true };
	}
	const exportedSet = new Set( exported );
	const missing = imported.filter( name => ! exportedSet.has( name ) );
	return { ok: missing.length === 0, consumer, provider, missing };
}

/**
 * Resolve a package's directory from a given base directory, honouring the
 * pnpm/monorepo resolution the webpack build itself uses.
 *
 * @param {string} pkgName - e.g. '@wordpress/theme'.
 * @param {string} fromDir - Directory to resolve from (the polyfill package root).
 * @return {string|null} Absolute package directory, or null if unresolvable.
 */
function resolvePackageDir( pkgName, fromDir ) {
	try {
		const pkgJson = require.resolve( `${ pkgName }/package.json`, { paths: [ fromDir ] } );
		return path.dirname( pkgJson );
	} catch {
		return null;
	}
}

/**
 * Read the concatenated ESM source of every `*.mjs` file under a package's
 * `build-module` directory (used to scan a consumer's imports).
 *
 * @param {string} pkgDir - Absolute package directory.
 * @return {string} Concatenated source, or '' if no build-module dir.
 */
function readBuildModuleSource( pkgDir ) {
	const dir = path.join( pkgDir, 'build-module' );
	if ( ! existsSync( dir ) ) {
		return '';
	}
	const chunks = [];
	const walk = current => {
		for ( const entry of readdirSync( current, { withFileTypes: true } ) ) {
			const full = path.join( current, entry.name );
			if ( entry.isDirectory() ) {
				walk( full );
			} else if ( entry.name.endsWith( '.mjs' ) ) {
				chunks.push( readFileSync( full, 'utf8' ) );
			}
		}
	};
	walk( dir );
	return chunks.join( '\n' );
}

/**
 * Read a provider package's public export names from its ESM entry point.
 *
 * @param {string} pkgDir - Absolute package directory.
 * @return {{ names: string[], opaque: boolean } | null} Exports, or null if unreadable.
 */
function readPackageExports( pkgDir ) {
	const pkg = JSON.parse( readFileSync( path.join( pkgDir, 'package.json' ), 'utf8' ) );
	const entry = pkg.module || pkg.main;
	if ( ! entry ) {
		return null;
	}
	const entryPath = path.join( pkgDir, entry );
	if ( ! existsSync( entryPath ) ) {
		return null;
	}
	return parsePublicExports( readFileSync( entryPath, 'utf8' ) );
}

/**
 * Run the export-contract validation across the shipped package set.
 *
 * Reads the shipped versions from the polyfill package's own resolution
 * context (same as the webpack build), so the check reflects exactly what the
 * package ships.
 *
 * @param {object}   [options]                 - Validation options.
 * @param {string}   [options.packageRoot]     - Polyfill package root. Defaults to this package.
 * @param {string[]} [options.providers]       - Override provider list (tests).
 * @param {string[]} [options.consumers]       - Override consumer list (tests).
 * @param {object}   [options.simulateMissing] - Map of providerPkg → symbol[] to drop from its exports, to simulate a skew (see WP_BUILD_POLYFILLS_SIMULATE_MISSING).
 * @return {{ ok: boolean, results: object[], errors: string[], error?: string }} The aggregate validation result.
 */
function validateExportContracts( options = {} ) {
	const packageRoot = options.packageRoot || path.join( __dirname, '..' );
	const providers = options.providers || PROVIDER_PACKAGES;
	const consumers = options.consumers || CONSUMER_PACKAGES;
	const simulateMissing =
		options.simulateMissing || parseSimulateEnv( process.env.WP_BUILD_POLYFILLS_SIMULATE_MISSING );

	const errors = [];

	// Resolve each provider's shipped public exports once.
	const providerExports = {};
	for ( const provider of providers ) {
		const dir = resolvePackageDir( provider, packageRoot );
		if ( ! dir ) {
			// A provider that isn't installed simply isn't shipped — skip it.
			continue;
		}
		const exp = readPackageExports( dir );
		if ( ! exp ) {
			errors.push( `Could not read exports for ${ provider } (no readable module entry).` );
			continue;
		}
		const dropped = simulateMissing[ provider ] || [];
		providerExports[ provider ] = {
			names: exp.names.filter( n => ! dropped.includes( n ) ),
			opaque: exp.opaque,
		};
	}

	const results = [];
	for ( const consumer of consumers ) {
		const dir = resolvePackageDir( consumer, packageRoot );
		if ( ! dir ) {
			continue;
		}
		const source = readBuildModuleSource( dir );
		if ( ! source ) {
			continue;
		}
		for ( const provider of Object.keys( providerExports ) ) {
			const imported = parseNamedImports( source, provider );
			if ( imported.length === 0 ) {
				continue;
			}
			results.push(
				checkContract( {
					consumer,
					provider,
					imported,
					exported: providerExports[ provider ].names,
					opaque: providerExports[ provider ].opaque,
				} )
			);
		}
	}

	const failures = results.filter( r => ! r.ok );
	const ok = failures.length === 0 && errors.length === 0;

	let error;
	if ( ! ok ) {
		error = formatError( failures, errors );
	}
	return { ok, results, errors, error };
}

/**
 * Parse the WP_BUILD_POLYFILLS_SIMULATE_MISSING env var into a drop-map.
 *
 * Format: comma-separated `@wordpress/pkg:Symbol` pairs, e.g. `@wordpress/theme:ThemeProvider`.
 *
 * @param {string|undefined} raw - Raw env value.
 * @return {object} Map of provider package → symbol[] to drop.
 */
function parseSimulateEnv( raw ) {
	const map = {};
	if ( ! raw ) {
		return map;
	}
	for ( const pair of raw.split( ',' ) ) {
		const idx = pair.lastIndexOf( ':' );
		if ( idx === -1 ) {
			continue;
		}
		const pkg = pair.slice( 0, idx ).trim();
		const symbol = pair.slice( idx + 1 ).trim();
		if ( ! pkg || ! symbol ) {
			continue;
		}
		( map[ pkg ] = map[ pkg ] || [] ).push( symbol );
	}
	return map;
}

/**
 * Build a human-readable, actionable error message.
 *
 * @param {object[]} failures - Failed contract results.
 * @param {string[]} errors   - Non-contract errors (unreadable packages, etc.).
 * @return {string} Formatted message.
 */
function formatError( failures, errors ) {
	const lines = [];
	if ( failures.length > 0 ) {
		lines.push(
			'Export-contract violation: a polyfilled package imports symbols that the',
			'shipped version of another polyfilled package does NOT export.',
			'',
			'This resolves to `undefined` at runtime → blank dashboard, no build error',
			'(this is the Jetpack 16.0 failure mode).',
			''
		);
		for ( const f of failures ) {
			lines.push(
				`   ${ f.consumer } imports from ${ f.provider }: [ ${ f.missing.join(
					', '
				) } ] — NOT exported.`
			);
		}
		lines.push(
			'',
			'Fix: bump the provider package so its shipped public API matches what the',
			'consumer expects, and keep the whole `@wordpress/*` set version-aligned',
			'(they are a co-released matched set). See package.json devDependencies.'
		);
	}
	if ( errors.length > 0 ) {
		lines.push( '', 'Additional problems:', ...errors.map( e => `   - ${ e }` ) );
	}
	return lines.join( '\n' );
}

module.exports = {
	parseNamedImports,
	parsePublicExports,
	checkContract,
	validateExportContracts,
	parseSimulateEnv,
	PROVIDER_PACKAGES,
	CONSUMER_PACKAGES,
};
