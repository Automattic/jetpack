/**
 * Library for the `stamp-textdomains` bin.
 *
 * Background: the `@wordpress/build` (esbuild) pipeline externalizes
 * `@wordpress/i18n` to the shared `window.wp.i18n` singleton, but in doing so
 * it drops the package text domain that the source `__()` / `_x()` / `_n()`
 * calls carried. The built bundle ends up with gettext calls that either have
 * no domain argument or the wrong one, so WordPress can't map them to a
 * catalog and the strings fall back to English — even when a translation
 * exists. (Upstream `@wordpress/build` has no babel/plugin hook to fix this at
 * build time; its only Babel use is hardcoded for Gutenberg's own package.)
 *
 * `stampDir(buildDir, domain)` runs `@automattic/babel-plugin-replace-textdomain`
 * over the emitted JS under build/{routes,scripts,modules,widgets}/**, so
 * every gettext call ends up with `domain` as its text-domain argument. The
 * plugin matches esbuild's `(0, import_i18n.__)(…)` sequence-expression shape,
 * checks the callee really resolves to `@wordpress/i18n`, appends a missing
 * domain, and replaces any wrong one — so the transform is idempotent (a
 * re-run is a no-op). Because it rewrites bundles wp-build has already hashed,
 * each stamped file's sibling `*.asset.php` version is recomputed too; see
 * `refreshAssetVersion()`.
 *
 * Note: every supported WordPress ships script-module i18n
 * (`wp_set_script_module_translations()`, since 7.0), so this post-build stamp —
 * and the runtime catalog loader that pairs with it — can likely be retired.
 */

const crypto = require( 'crypto' );
const fs = require( 'fs' );
const path = require( 'path' );
const { transformSync } = require( '@babel/core' );
const { extractGettextCalls } = require( './i18n-stub-lib.js' );

const PLUGIN = require.resolve( '@automattic/babel-plugin-replace-textdomain' );

// Name of the catalog manifest emitted next to the stamped bundles. The
// shared `loadI18nCatalogs` init-module helper fetches it at runtime to learn
// which bundles carry translatable strings.
const I18N_MANIFEST = 'i18n-manifest.json';

// The wp-build subdirs that hold JS. Same set strip-unminified-prod walks,
// minus `styles` (no gettext calls in CSS).
const TARGET_SUBDIRS = [ 'routes', 'scripts', 'modules', 'widgets' ];

// Bump when the cache entry shape changes, to orphan every existing entry.
const CACHE_FORMAT = 1;

// Their versions feed the cache key: a generator update alone changes the stamped bytes.
const BABEL_PACKAGES = [
	'@babel/core',
	'@babel/parser',
	'@babel/traverse',
	'@babel/generator',
	'@babel/types',
];

/**
 * Shared Babel options for a single stamp pass.
 *
 * @param {string}  domain - Text domain to stamp onto every gettext call.
 * @param {boolean} isMin  - Whether the input is a minified bundle. Minified
 *                         input is regenerated compact; readable input keeps
 *                         its line numbers so make-pot references stay stable.
 * @return {object} Options object for `@babel/core` `transformSync`.
 */
function babelOptions( domain, isMin ) {
	return {
		babelrc: false,
		configFile: false,
		compact: isMin,
		retainLines: ! isMin,
		comments: true,
		sourceType: 'unambiguous',
		// `requireI18nSource` keeps the stamp off gettext-shaped calls that
		// belong to something else — a bundled dependency's own
		// `cache.__( key )` reads identically to a real `__()` once esbuild
		// has inlined it into the same file.
		plugins: [ [ PLUGIN, { textdomain: domain, requireI18nSource: true } ] ],
	};
}

/**
 * Stamp a text domain onto a string of JavaScript. Pure — no filesystem
 * access — so tests can exercise the transform on fixture strings.
 *
 * @param {string}  code   - JavaScript source to transform.
 * @param {string}  domain - Text domain to stamp onto every gettext call.
 * @param {boolean} isMin  - Whether `code` is minified (regenerate compact).
 * @return {string} The transformed source.
 */
function stampCode( code, domain, isMin ) {
	return transformSync( code, babelOptions( domain, isMin ) ).code;
}

/**
 * Recompute the cache-busting version in a bundle's sibling `*.asset.php`.
 *
 * wp-build hashes each emitted bundle into `'version'` during the esbuild
 * pass, before this tool rewrites the file. Left alone, a release whose only
 * change to a bundle is the text-domain stamp ships with the version it had
 * before, and browsers keep serving the cached unstamped copy — the strings
 * stay English until something else in that bundle changes. Rehashing the
 * stamped bytes with wp-build's own scheme (sha256, first 20 hex chars of the
 * emitted file) keeps the version a function of what actually shipped.
 *
 * Only the sibling that pairs with this exact file is touched:
 * `content.min.js` → `content.min.asset.php`. wp-build emits asset files for
 * the minified bundles, so unminified siblings usually have none.
 *
 * @param {string} file - Absolute path to the `.js` / `.min.js` file, already rewritten.
 * @return {boolean} Whether an asset file was updated.
 */
function refreshAssetVersion( file ) {
	const assetFile = `${ file.slice( 0, -3 ) }.asset.php`;
	if ( ! file.endsWith( '.js' ) || ! fs.existsSync( assetFile ) ) {
		return false;
	}
	const version = crypto
		.createHash( 'sha256' )
		.update( fs.readFileSync( file ) )
		.digest( 'hex' )
		.slice( 0, 20 );

	const source = fs.readFileSync( assetFile, 'utf8' );
	const updated = source.replace(
		/('version'\s*=>\s*')[^']*(')/,
		( _match, before, after ) => before + version + after
	);
	if ( updated === source ) {
		return false;
	}
	fs.writeFileSync( assetFile, updated );
	return true;
}

/**
 * Stamp a text domain onto a built JS file in place, updating a sibling
 * source map when one is present and rehashing a sibling `*.asset.php`.
 *
 * @param {string} file   - Absolute path to the `.js` / `.min.js` file.
 * @param {string} domain - Text domain to stamp onto every gettext call.
 */
function stampFile( file, domain ) {
	const code = fs.readFileSync( file, 'utf8' );
	const isMin = file.endsWith( '.min.js' );
	const mapFile = `${ file }.map`;
	const hasMap = fs.existsSync( mapFile );

	const result = transformSync( code, {
		...babelOptions( domain, isMin ),
		filename: file,
		inputSourceMap: hasMap ? JSON.parse( fs.readFileSync( mapFile, 'utf8' ) ) : undefined,
		sourceMaps: hasMap,
	} );

	fs.writeFileSync( file, result.code );
	if ( hasMap && result.map ) {
		fs.writeFileSync( mapFile, JSON.stringify( result.map ) );
	}
	refreshAssetVersion( file );
}

/**
 * Hash everything other than the input bundle that can change the stamped bytes.
 *
 * @param {string} domain - Text domain being stamped.
 * @return {string} Hex digest mixed into every cache key.
 */
function toolFingerprint( domain ) {
	const hash = crypto.createHash( 'sha256' ).update( `${ CACHE_FORMAT }\0${ domain }\0` );
	const pluginDir = path.dirname( PLUGIN );
	const sources = [
		require.resolve( './stamp-textdomains-lib.js' ),
		require.resolve( './i18n-stub-lib.js' ),
		...fs
			.readdirSync( pluginDir )
			.filter( name => name.endsWith( '.js' ) )
			.sort()
			.map( name => path.join( pluginDir, name ) ),
	];
	for ( const file of sources ) {
		hash.update( fs.readFileSync( file ) ).update( '\0' );
	}
	const babelDir = path.dirname( require.resolve( '@babel/core' ) );
	for ( const name of BABEL_PACKAGES ) {
		const manifest = require.resolve( `${ name }/package.json`, { paths: [ babelDir ] } );
		hash.update( `${ name }@${ require( manifest ).version }\0` );
	}
	return hash.digest( 'hex' );
}

/**
 * Read a cache entry, treating a missing or unreadable one as a miss.
 *
 * @param {string} entryFile - Absolute path to the entry.
 * @return {{code: string, map: string|null, hasGettext: boolean|null}|null} The entry, or null.
 */
function readCacheEntry( entryFile ) {
	try {
		const entry = JSON.parse( fs.readFileSync( entryFile, 'utf8' ) );
		return typeof entry.code === 'string' ? entry : null;
	} catch {
		return null;
	}
}

/**
 * Write a cache entry. Best effort: a failed write only costs a future miss.
 *
 * @param {string} entryFile - Absolute path to the entry.
 * @param {object} entry     - Entry to store.
 */
function writeCacheEntry( entryFile, entry ) {
	// Rename into place so a killed or concurrent run never leaves a partial entry.
	const tmp = `${ entryFile }.${ crypto.randomUUID() }.tmp`;
	try {
		fs.writeFileSync( tmp, JSON.stringify( entry ) );
		fs.renameSync( tmp, entryFile );
	} catch {
		fs.rmSync( tmp, { force: true } );
	}
}

/**
 * Stamp one bundle, reusing a cached result when the same bytes were stamped before.
 *
 * @param {string}      file   - Absolute path to the `.js` / `.min.js` file.
 * @param {string}      domain - Text domain to stamp onto every gettext call.
 * @param {object|null} cache  - `{ dir, fingerprint, used }`, or null to always stamp.
 * @return {{hasGettext: boolean, reused: boolean}} `hasGettext` is always false for `.min.js`.
 */
function stampBundle( file, domain, cache ) {
	const isMin = file.endsWith( '.min.js' );
	const mapFile = `${ file }.map`;
	const hasMap = fs.existsSync( mapFile );

	let entryFile = null;
	if ( cache ) {
		const key = crypto
			.createHash( 'sha256' )
			.update( `${ cache.fingerprint }\0${ isMin }\0${ hasMap }\0` )
			.update( fs.readFileSync( file ) )
			.update( '\0' )
			.update( hasMap ? fs.readFileSync( mapFile ) : '' )
			.digest( 'hex' );
		entryFile = path.join( cache.dir, `${ key }.json` );
		cache.used.add( path.basename( entryFile ) );

		const entry = readCacheEntry( entryFile );
		if ( entry ) {
			fs.writeFileSync( file, entry.code );
			if ( hasMap && entry.map !== null ) {
				fs.writeFileSync( mapFile, entry.map );
			}
			refreshAssetVersion( file );
			return { hasGettext: entry.hasGettext === true, reused: true };
		}
	}

	stampFile( file, domain );
	const code = fs.readFileSync( file, 'utf8' );
	const hasGettext = ! isMin && extractGettextCalls( code ).length > 0;
	if ( entryFile ) {
		writeCacheEntry( entryFile, {
			code,
			map: hasMap ? fs.readFileSync( mapFile, 'utf8' ) : null,
			hasGettext,
		} );
	}
	return { hasGettext, reused: false };
}

/**
 * Delete cache entries this run did not use, keeping the cache at one build's worth.
 *
 * @param {object} cache - `{ dir, used }` from the run that just finished.
 */
function pruneCache( cache ) {
	for ( const name of fs.readdirSync( cache.dir ) ) {
		if ( ! cache.used.has( name ) ) {
			fs.rmSync( path.join( cache.dir, name ), { force: true } );
		}
	}
}

/**
 * Stamp a text domain onto every JS bundle in a wp-build output tree.
 *
 * With `cacheDir`, a bundle whose bytes (and source map) match one stamped by an
 * earlier run is restored from the cache instead of re-parsed. Output is identical.
 *
 * @param {string} buildDir           - Absolute path to the package's build/ directory.
 * @param {string} domain             - Text domain to stamp onto every gettext call.
 * @param {object} [options]          - Options.
 * @param {string} [options.cacheDir] - Directory for the stamp cache; omit to disable it.
 * @return {{count: number, reused: number, stringBearing: string[]}} `stringBearing` lists the non-min bundles carrying gettext calls.
 */
function stampDir( buildDir, domain, { cacheDir } = {} ) {
	let cache = null;
	if ( cacheDir ) {
		fs.mkdirSync( cacheDir, { recursive: true } );
		cache = { dir: cacheDir, fingerprint: toolFingerprint( domain ), used: new Set() };
	}

	let count = 0;
	let reused = 0;
	const stringBearing = [];
	for ( const sub of TARGET_SUBDIRS ) {
		const dir = path.join( buildDir, sub );
		if ( ! fs.existsSync( dir ) ) {
			continue;
		}
		walk( dir, file => {
			if ( ! file.endsWith( '.js' ) ) {
				return;
			}
			const result = stampBundle( file, domain, cache );
			count++;
			if ( result.reused ) {
				reused++;
			}
			if ( result.hasGettext ) {
				stringBearing.push( file );
			}
		} );
	}

	if ( cache ) {
		pruneCache( cache );
	}
	return { count, reused, stringBearing };
}

/**
 * Find the non-minified bundles in a build tree that carry gettext calls.
 *
 * @param {string} buildDir - Absolute path to the package's build/ directory.
 * @return {string[]} Absolute paths.
 */
function findStringBearingBundles( buildDir ) {
	const found = [];
	for ( const sub of TARGET_SUBDIRS ) {
		const dir = path.join( buildDir, sub );
		if ( ! fs.existsSync( dir ) ) {
			continue;
		}
		walk( dir, file => {
			if ( ! file.endsWith( '.js' ) || file.endsWith( '.min.js' ) ) {
				return;
			}
			if ( extractGettextCalls( fs.readFileSync( file, 'utf8' ) ).length > 0 ) {
				found.push( file );
			}
		} );
	}
	return found;
}

/**
 * Write the i18n catalog manifest for a wp-build output tree.
 *
 * Lists every non-minified `.js` bundle that carries gettext calls, as
 * package-relative paths (e.g. `build/routes/inbox/content.js`) — the exact
 * path shape `wp.jpI18nLoader.downloadI18n()` hashes to name a catalog. The
 * shared `loadI18nCatalogs` helper fetches this manifest at runtime instead of
 * each dashboard hand-maintaining a bundle list that drifts as routes,
 * scripts, and widgets are added.
 *
 * Call after `stampDir()`: in production builds `strip-unminified-prod` later
 * replaces each listed `.js` with an i18n reference stub at the same path, so
 * the manifest stays valid.
 *
 * @param {string}   buildDir        - Absolute path to the package's build/ directory.
 * @param {string[]} [stringBearing] - `stampDir()`'s list of absolute paths; omit to rescan the tree.
 * @return {string[]} The package-relative bundle paths written to the manifest.
 */
function writeI18nManifest( buildDir, stringBearing = findStringBearingBundles( buildDir ) ) {
	const prefix = path.basename( buildDir );
	const bundles = stringBearing.map(
		file => prefix + '/' + path.relative( buildDir, file ).split( path.sep ).join( '/' )
	);
	bundles.sort();
	fs.writeFileSync(
		path.join( buildDir, I18N_MANIFEST ),
		JSON.stringify( { bundles }, null, '\t' ) + '\n'
	);
	return bundles;
}

/**
 * Recursively walk a directory, passing every regular file path to a callback.
 *
 * @param {string}                   dir   - Absolute path to the directory to walk.
 * @param {(filePath: string)=>void} visit - Called once per regular file under `dir`.
 */
function walk( dir, visit ) {
	for ( const entry of fs.readdirSync( dir, { withFileTypes: true } ) ) {
		const p = path.join( dir, entry.name );
		if ( entry.isDirectory() ) {
			walk( p, visit );
		} else if ( entry.isFile() ) {
			visit( p );
		}
	}
}

module.exports = {
	stampCode,
	stampFile,
	stampDir,
	refreshAssetVersion,
	writeI18nManifest,
	walk,
	TARGET_SUBDIRS,
	I18N_MANIFEST,
};
