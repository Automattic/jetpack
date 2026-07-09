/**
 * Library for the `strip-unminified-prod` bin.
 *
 * Background: `@wordpress/build` emits two copies of every route/script/
 * module/widget bundle — a minified `*.min.js` (loaded when SCRIPT_DEBUG is false)
 * and an unminified `*.js` (loaded when SCRIPT_DEBUG is true). It does the
 * same thing for stylesheets, with a slightly different shape (`*.css` /
 * `*.min.css`, with a `$suffix` ternary in the generated `styles.php`
 * instead of a `$extension` one). On production servers the unminified
 * copies are never loaded but are still mirrored to deploy targets,
 * inflating the payload by ~13 MiB as of this writing.
 *
 * `strip(buildDir)` deletes the unminified siblings under
 * build/{routes,scripts,modules,styles,widgets}/** and rewrites the generated
 * routes.php / scripts.php / modules.php / styles.php / widgets.php loaders so the
 * SCRIPT_DEBUG branch collapses to the minified asset — keeping the asset
 * reachable even if a deploy target enables SCRIPT_DEBUG. The function is
 * idempotent and throws if it finds a SCRIPT_DEBUG-driven `.js`/`.min`
 * fallback that none of its patches recognised (indicating the wp-build
 * PHP template changed shape and the patches need updating).
 *
 * Note about SCRIPT_DEBUG-on-production debugging: after this runs, a
 * deploy target with SCRIPT_DEBUG=true gets the minified bundle, not the
 * unminified one. Devtools sourcemaps still resolve names, but in-page
 * stack traces and `view-source` are no longer readable. This is a small
 * trade-off relative to the ~10 MiB of dead bytes the unminified copies
 * would otherwise add to every production mirror.
 */

const { readdirSync, existsSync, unlinkSync, readFileSync, writeFileSync } = require( 'fs' );
const path = require( 'path' );

const TARGET_SUBDIRS = [ 'routes', 'scripts', 'modules', 'styles', 'widgets' ];
const STRIPPABLE_EXTS = [ '.js', '.css' ];

// Patches collapse SCRIPT_DEBUG-driven ternaries to the minified asset.
// Three shapes need to be handled:
//
// 1. Single-line extension ternary in routes.php, scripts.php, and widgets.php:
//      $extension = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '.js' : '.min.js';
//
// 2. Multi-line extension ternary in modules.php (with min_only carve-out):
//      $extension = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG && empty( $module['min_only'] ) )
//          ? '.js'
//          : '.min.js';
//
// 3. Suffix ternary in styles.php:
//      $suffix = SCRIPT_DEBUG ? '' : '.min';
const REPLACEMENTS = [
	{
		pattern: /defined\(\s*'SCRIPT_DEBUG'\s*\)\s*&&\s*SCRIPT_DEBUG\s*\?\s*'\.js'\s*:\s*'\.min\.js'/g,
		replacement: "'.min.js'",
	},
	{
		pattern:
			/\(\s*defined\(\s*'SCRIPT_DEBUG'\s*\)\s*&&\s*SCRIPT_DEBUG\s*&&\s*empty\(\s*\$module\['min_only'\]\s*\)\s*\)\s*\?\s*'\.js'\s*:\s*'\.min\.js'/g,
		replacement: "'.min.js'",
	},
	{
		pattern: /SCRIPT_DEBUG\s*\?\s*''\s*:\s*'\.min'/g,
		replacement: "'.min'",
	},
];

// Safety net: if our patches don't match but the file still references an
// unminified fallback via SCRIPT_DEBUG, the wp-build template has changed
// and we'd ship a loader that 404s on SCRIPT_DEBUG=true. Fail loudly so the
// build catches it. Catches both the extension and the suffix shapes.
const UNMATCHED_SUSPICIOUS_PATTERNS = [ /\?\s*'\.js'\s*:\s*'\.min\.js'/, /\?\s*''\s*:\s*'\.min'/ ];

const PHP_TARGETS = [ 'routes.php', 'scripts.php', 'modules.php', 'styles.php', 'widgets.php' ];

/**
 * Recursively walk a directory and pass every file path to a callback.
 * Missing directories are silently skipped, since not every consuming
 * package emits all of routes/scripts/modules/styles/widgets.
 *
 * @param {string}                   dir   - Absolute path to the directory to walk.
 * @param {(filePath: string)=>void} visit - Called once per regular file under `dir`.
 */
function walk( dir, visit ) {
	let entries;
	try {
		entries = readdirSync( dir, { withFileTypes: true } );
	} catch {
		return;
	}
	for ( const entry of entries ) {
		const fullPath = path.join( dir, entry.name );
		if ( entry.isDirectory() ) {
			walk( fullPath, visit );
		} else if ( entry.isFile() ) {
			visit( fullPath );
		}
	}
}

/**
 * Delete a file if it is the unminified sibling of an existing
 * `.min.js`/`.min.css` counterpart. Also drops any sibling source map.
 * Files that are already minified, orphaned (no `.min` counterpart), or of
 * an unrelated extension are left alone.
 *
 * @param {string} filePath - Absolute path to the candidate file.
 * @return {boolean} `true` if the file was deleted, `false` otherwise.
 */
function stripIfPaired( filePath ) {
	for ( const ext of STRIPPABLE_EXTS ) {
		if ( filePath.endsWith( '.min' + ext ) ) {
			return false;
		}
		if ( filePath.endsWith( ext ) ) {
			const minPath = filePath.slice( 0, -ext.length ) + '.min' + ext;
			if ( ! existsSync( minPath ) ) {
				return false;
			}
			unlinkSync( filePath );
			const mapPath = filePath + '.map';
			if ( existsSync( mapPath ) ) {
				unlinkSync( mapPath );
			}
			return true;
		}
	}
	return false;
}

/**
 * Apply all known SCRIPT_DEBUG patches to a PHP loader's contents. Returns
 * the patched source, or `null` if no patch was applied (already collapsed
 * or unknown shape).
 *
 * @param {string} source - Original PHP file contents.
 * @return {string|null} Patched contents, or `null` for no-op.
 */
function patchPhpSource( source ) {
	let next = source;
	for ( const { pattern, replacement } of REPLACEMENTS ) {
		next = next.replace( pattern, replacement );
	}
	return next === source ? null : next;
}

/**
 * Check whether a PHP source still contains a SCRIPT_DEBUG-driven fallback
 * that none of our patches recognise. Used as a safety net after patching.
 *
 * @param {string} source - PHP file contents (after patching attempts).
 * @return {boolean} `true` if a suspicious fallback remains.
 */
function hasUnpatchedFallback( source ) {
	return UNMATCHED_SUSPICIOUS_PATTERNS.some( re => re.test( source ) );
}

/**
 * Strip unminified JS/CSS siblings from a wp-build output tree and rewrite
 * the generated PHP loaders. See module docstring for context.
 *
 * @param {string} buildDir - Absolute path to the package's build/ directory.
 * @return {{deletedFiles: number, patchedFiles: number, skipped: boolean}} Summary of what changed. `skipped: true` if `buildDir` doesn't exist.
 */
function strip( buildDir ) {
	if ( ! existsSync( buildDir ) ) {
		return { deletedFiles: 0, patchedFiles: 0, skipped: true };
	}

	let deletedFiles = 0;
	let patchedFiles = 0;

	for ( const sub of TARGET_SUBDIRS ) {
		walk( path.join( buildDir, sub ), filePath => {
			if ( stripIfPaired( filePath ) ) {
				deletedFiles++;
			}
		} );
	}

	for ( const fileName of PHP_TARGETS ) {
		const filePath = path.join( buildDir, fileName );
		if ( ! existsSync( filePath ) ) {
			continue;
		}
		const source = readFileSync( filePath, 'utf8' );
		const next = patchPhpSource( source );

		// Inspect the post-patch text (or the original, if nothing matched).
		// A non-null `next` can still contain a sibling ternary shape that
		// slipped past every REPLACEMENTS pattern, and writing that out would
		// ship a loader that 404s on SCRIPT_DEBUG=true.
		if ( hasUnpatchedFallback( next ?? source ) ) {
			throw new Error(
				`[strip-unminified-prod] ${ fileName } still references a SCRIPT_DEBUG-driven ` +
					`unminified fallback that our patches did not match. The wp-build PHP template ` +
					`likely changed shape — update bin/strip-unminified-prod-lib.js in ` +
					`@automattic/jetpack-wp-build-polyfills.`
			);
		}

		if ( next === null ) {
			continue;
		}

		writeFileSync( filePath, next );
		patchedFiles++;
	}

	return { deletedFiles, patchedFiles, skipped: false };
}

module.exports = {
	strip,
	stripIfPaired,
	patchPhpSource,
	hasUnpatchedFallback,
	walk,
	TARGET_SUBDIRS,
	PHP_TARGETS,
	REPLACEMENTS,
	UNMATCHED_SUSPICIOUS_PATTERNS,
};
