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

const PLUGIN = require.resolve( '@automattic/babel-plugin-replace-textdomain' );

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

module.exports = { stampCode, stampFile, stampDir, walk, TARGET_SUBDIRS };
