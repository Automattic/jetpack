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
 * plugin matches esbuild's `(0, import_i18n.__)(…)` sequence-expression shape
 * by the callee's member-property name, appends a missing domain, and replaces
 * any wrong one — so the transform is idempotent (a re-run is a no-op).
 *
 * Note: WordPress core merged script-module i18n
 * (`wp_set_script_module_translations()`, WP 7.0). Once Jetpack's WP floor
 * reaches 7.0, this post-build stamp — and the runtime catalog loader that
 * pairs with it — can likely be retired.
 */

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
		plugins: [ [ PLUGIN, { textdomain: domain } ] ],
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
 * Stamp a text domain onto a built JS file in place, updating a sibling
 * source map when one is present.
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
}

/**
 * Stamp a text domain onto every JS bundle in a wp-build output tree.
 *
 * @param {string} buildDir - Absolute path to the package's build/ directory.
 * @param {string} domain   - Text domain to stamp onto every gettext call.
 * @return {number} Count of JS files stamped.
 */
function stampDir( buildDir, domain ) {
	let count = 0;
	for ( const sub of TARGET_SUBDIRS ) {
		const dir = path.join( buildDir, sub );
		if ( ! fs.existsSync( dir ) ) {
			continue;
		}
		walk( dir, file => {
			if ( file.endsWith( '.js' ) ) {
				stampFile( file, domain );
				count++;
			}
		} );
	}
	return count;
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
 * @param {string} buildDir - Absolute path to the package's build/ directory.
 * @return {string[]} The package-relative bundle paths written to the manifest.
 */
function writeI18nManifest( buildDir ) {
	const prefix = path.basename( buildDir );
	const bundles = [];
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
				bundles.push(
					prefix + '/' + path.relative( buildDir, file ).split( path.sep ).join( '/' )
				);
			}
		} );
	}
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
	writeI18nManifest,
	walk,
	TARGET_SUBDIRS,
	I18N_MANIFEST,
};
