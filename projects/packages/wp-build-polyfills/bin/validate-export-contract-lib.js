/* global __dirname, process */
/**
 * Export-contract validation: assert every symbol a consumer package imports from
 * a polyfilled provider actually exists in the shipped provider's public exports.
 * A missing symbol resolves to `undefined` at runtime (blank dashboard, no build
 * error) — the Jetpack 16.0 failure mode. Shared by the post-build CLI and tests.
 */

const { readFileSync, readdirSync, existsSync } = require( 'fs' );
const path = require( 'path' );

/**
 * Map a classic-script handle to its npm package name (`wp-theme` → `@wordpress/theme`).
 *
 * @param {string} handle - A `wp-*` script handle.
 * @return {string} The `@wordpress/*` package name.
 */
function handleToPackage( handle ) {
	return '@wordpress/' + handle.replace( /^wp-/, '' );
}

/**
 * Extract the string values of a `const NAME = array( 'a', 'b' );` PHP class constant.
 *
 * @param {string} phpSource - PHP file contents.
 * @param {string} constName - Constant name.
 * @return {string[]} The array's string values, or [] if not found.
 */
function parsePhpConstArray( phpSource, constName ) {
	const match = phpSource.match(
		new RegExp( `const\\s+${ constName }\\s*=\\s*array\\(([^)]*)\\)` )
	);
	return match ? match[ 1 ].match( /'([^']+)'/g )?.map( s => s.replace( /'/g, '' ) ) ?? [] : [];
}

/**
 * Derive the shipped provider/consumer lists from the class constants in
 * class-wp-build-polyfills.php (SCRIPT_HANDLES + MODULE_IDS) — the single source of
 * truth that also registers them at runtime. Providers are the classic-script globals
 * whose exports we verify; consumers are the ESM modules that import them.
 *
 * @param {string} packageRoot - Polyfill package root.
 * @return {{ providers: string[], consumers: string[] }} Providers and consumers.
 */
function getShippedPackages( packageRoot ) {
	const php = readFileSync(
		path.join( packageRoot, 'src', 'class-wp-build-polyfills.php' ),
		'utf8'
	);
	return {
		providers: parsePhpConstArray( php, 'SCRIPT_HANDLES' ).map( handleToPackage ),
		consumers: parsePhpConstArray( php, 'MODULE_IDS' ),
	};
}

/**
 * Original names of the symbols named-imported from a provider in ESM source.
 * Handles `import { A, B as C } from '@wordpress/x'` and the mixed default form
 * `import Def, { A } from '@wordpress/x'` (imported name is before `as`); a pure
 * default or namespace import has no `{ … }` and is ignored (can't be a missing
 * named export). Matches `import` statements only — an `export { … } from
 * '@wordpress/x'` re-export is not a consumer import and yields nothing.
 *
 * @param {string} source      - ESM source text.
 * @param {string} providerPkg - e.g. '@wordpress/theme'.
 * @return {string[]} Sorted, de-duplicated imported symbol names.
 */
function parseNamedImports( source, providerPkg ) {
	const found = new Set();
	const escaped = providerPkg.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
	// Optional `Default,` before the named block covers `import Def, { A } from …`.
	const re = new RegExp(
		`import\\s*(?:[\\w$]+\\s*,\\s*)?\\{([^}]*)\\}\\s*from\\s*['"]${ escaped }['"]`,
		'g'
	);
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
 * Public export names from a provider's built ESM index. Handles consolidated
 * `export { A, B as C }` blocks (public name is after `as`) and inline
 * declarations `export const/function/class/let/var X`; flags wildcard
 * `export *` as opaque so callers skip it rather than emit a false "missing
 * export". (`@wordpress/*` ship esbuild-consolidated indexes today, but an
 * inline-export bump must not make the check report every symbol missing.)
 *
 * @param {string} indexSource - Contents of the package's entry point.
 * @return {{ names: string[], opaque: boolean }} Public export names + opacity flag.
 */
function parsePublicExports( indexSource ) {
	const names = new Set();
	const opaque = /export\s*\*/.test( indexSource );

	const blockRe = /export\s*\{([^}]*)\}/g;
	let match;
	while ( ( match = blockRe.exec( indexSource ) ) !== null ) {
		for ( const specifier of match[ 1 ].split( ',' ) ) {
			const trimmed = specifier.trim();
			if ( ! trimmed ) {
				continue;
			}
			const parts = trimmed.split( /\s+as\s+/ );
			const name = parts[ parts.length - 1 ].trim();
			if ( name ) {
				names.add( name );
			}
		}
	}

	// Inline declarations, e.g. `export const ThemeProvider = …`.
	for ( const m of indexSource.matchAll(
		/export\s+(?:async\s+)?(?:function|class|const|let|var)\s+([\w$]+)/g
	) ) {
		names.add( m[ 1 ] );
	}

	return { names: [ ...names ].sort(), opaque };
}

/**
 * Contract check for one (consumer → provider) pair.
 *
 * @param {object}   args          - The pair and its symbols.
 * @param {string}   args.consumer - Consumer package name.
 * @param {string}   args.provider - Provider package name.
 * @param {string[]} args.imported - Symbols the consumer imports.
 * @param {string[]} args.exported - Provider's public export names.
 * @param {boolean}  [args.opaque] - True when the provider's exports can't be enumerated.
 * @return {{ ok: boolean, consumer: string, provider: string, missing: string[], skipped?: boolean }} Result.
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
 * Resolve a package's directory from a base dir (same resolution the build uses).
 *
 * @param {string} pkgName - e.g. '@wordpress/theme'.
 * @param {string} fromDir - Directory to resolve from.
 * @return {string|null} Absolute package directory, or null if unresolvable.
 */
function resolvePackageDir( pkgName, fromDir ) {
	try {
		return path.dirname( require.resolve( `${ pkgName }/package.json`, { paths: [ fromDir ] } ) );
	} catch {
		return null;
	}
}

/**
 * Concatenated ESM source of every `*.mjs` under a package's `build-module` dir.
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
 * Read a provider's public export names from its ESM entry point.
 *
 * @param {string} pkgDir - Absolute package directory.
 * @return {{ names: string[], opaque: boolean } | null} Exports, or null if unreadable.
 */
function readPackageExports( pkgDir ) {
	const pkg = JSON.parse( readFileSync( path.join( pkgDir, 'package.json' ), 'utf8' ) );
	// Prefer the `exports` map's ESM entry (how resolution actually works), then
	// fall back to `module`/`main`. `@wordpress/boot` already ships no `main`.
	const dot = pkg.exports?.[ '.' ];
	const entry = ( typeof dot === 'string' ? dot : dot?.import ) ?? pkg.module ?? pkg.main;
	if ( ! entry ) {
		return null;
	}
	const entryPath = path.join( pkgDir, entry );
	return existsSync( entryPath ) ? parsePublicExports( readFileSync( entryPath, 'utf8' ) ) : null;
}

/**
 * Format an actionable error message for failed contracts.
 *
 * @param {object[]} failures - Failed contract results.
 * @param {string[]} errors   - Non-contract errors (unreadable packages).
 * @return {string} Formatted message.
 */
function formatError( failures, errors ) {
	const lines = [];
	if ( failures.length ) {
		lines.push(
			'Export-contract violation: a polyfilled package imports symbols the shipped',
			'version of another polyfilled package does not export — this resolves to',
			'`undefined` at runtime (blank dashboard, no build error; the Jetpack 16.0',
			'failure mode). Bump the provider so its public API matches, keeping the',
			'`@wordpress/*` set version-aligned.',
			''
		);
		for ( const f of failures ) {
			lines.push(
				`   ${ f.consumer } imports from ${ f.provider }: [ ${ f.missing.join(
					', '
				) } ] — not exported.`
			);
		}
	}
	if ( errors.length ) {
		lines.push( '', ...errors );
	}
	return lines.join( '\n' );
}

/**
 * Parse WP_BUILD_POLYFILLS_SIMULATE_MISSING (`pkg:Symbol,pkg:Symbol`) into a
 * `{ pkg: [ symbol ] }` drop-map. This is a TEST-ONLY hook that lets the CLI's
 * failure path be exercised end-to-end (see the CLI test); it is not a
 * user-facing feature.
 *
 * @param {string|undefined} raw - Raw env value.
 * @return {object} Map of provider package → symbol[] to drop.
 */
function parseSimulateEnv( raw ) {
	const map = {};
	for ( const pair of ( raw || '' ).split( ',' ) ) {
		const idx = pair.lastIndexOf( ':' );
		const pkg = idx === -1 ? '' : pair.slice( 0, idx ).trim();
		const symbol = idx === -1 ? '' : pair.slice( idx + 1 ).trim();
		if ( pkg && symbol ) {
			( map[ pkg ] = map[ pkg ] || [] ).push( symbol );
		}
	}
	return map;
}

/**
 * Validate the export contracts across the shipped package set. Reads the shipped
 * versions from the polyfill's own resolution context (same as the build).
 *
 * @param {object}   [options]                 - Options.
 * @param {string}   [options.packageRoot]     - Polyfill package root. Defaults to this package.
 * @param {string[]} [options.providers]       - Override provider list (tests).
 * @param {string[]} [options.consumers]       - Override consumer list (tests).
 * @param {object}   [options.simulateMissing] - Map of providerPkg → symbol[] to drop, to simulate a skew (tests).
 * @return {{ ok: boolean, results: object[], errors: string[], error?: string }} Aggregate result.
 */
function validateExportContracts( options = {} ) {
	const packageRoot = options.packageRoot || path.join( __dirname, '..' );
	const shipped = getShippedPackages( packageRoot );
	const providers = options.providers || shipped.providers;
	const consumers = options.consumers || shipped.consumers;
	const simulateMissing =
		options.simulateMissing || parseSimulateEnv( process.env.WP_BUILD_POLYFILLS_SIMULATE_MISSING );

	// Never drop a package from coverage silently — a check that verifies nothing
	// but stays green is the failure mode this exists to prevent.
	const warn = message => {
		// eslint-disable-next-line no-console
		console.warn( `[export-contract] ${ message }` );
	};

	const errors = [];
	const providerExports = {};
	for ( const provider of providers ) {
		const dir = resolvePackageDir( provider, packageRoot );
		if ( ! dir ) {
			warn( `Provider ${ provider } is not resolvable — not verifying it.` );
			continue;
		}
		const exp = readPackageExports( dir );
		if ( ! exp ) {
			errors.push( `Could not read exports for ${ provider }.` );
			continue;
		}
		if ( exp.opaque ) {
			warn(
				`Not verifying ${ provider }: its index uses \`export *\`, so its public ` +
					'exports can’t be enumerated statically.'
			);
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
			warn( `Consumer ${ consumer } is not resolvable — its imports were not checked.` );
			continue;
		}
		const source = readBuildModuleSource( dir );
		if ( ! source ) {
			warn( `Consumer ${ consumer } has no build-module/ — its imports were not checked.` );
			continue;
		}
		for ( const provider of Object.keys( providerExports ) ) {
			const imported = parseNamedImports( source, provider );
			if ( imported.length ) {
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
	}

	const failures = results.filter( r => ! r.ok );
	const ok = failures.length === 0 && errors.length === 0;
	return { ok, results, errors, error: ok ? undefined : formatError( failures, errors ) };
}

module.exports = {
	handleToPackage,
	parsePhpConstArray,
	getShippedPackages,
	parseNamedImports,
	parsePublicExports,
	checkContract,
	validateExportContracts,
};
