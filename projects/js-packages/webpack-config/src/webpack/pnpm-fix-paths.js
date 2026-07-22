/**
 * Helper to strip versions from pnpm's store paths.
 */

const PNPM_PATH_REGEXP =
	/(?<=^|[|!])(?:\.\.\/)*node_modules\/\.pnpm\/[^/!|]*\/node_modules\/([^|!]+)/g;

/*
 * With `enableGlobalVirtualStore`, packages live at
 * `<store>/v<N>/links/<@scope|@>/<name>/<version>/<hash>/node_modules/<path>`.
 */
const PNPM_GLOBAL_STORE_PATH_REGEXP =
	/(?<=^|[|!])[^|!]*?\/v[0-9]+\/links\/@[^/!|]*\/[^/!|]+\/[^/!|]+\/[0-9a-f]{32,}\/node_modules\/([^|!]+)/g;

/**
 * Replace pnpm store paths in an identifier.
 *
 * Pnpm's store paths contain the version number of the package, which means
 * the identifier would change every time the package is updated. This strips
 * those out of the identifier.
 *
 * This does mean that a bundle with multiple versions of a package might wind
 * up with colliding identifiers, but Webpack already handles that.
 *
 * @param {string} identifier - Identifier.
 * @return {string} Transformed identifier.
 */
function fixPnpmPaths( identifier ) {
	return identifier
		.replace( PNPM_PATH_REGEXP, '.pnpm/$1' )
		.replace( PNPM_GLOBAL_STORE_PATH_REGEXP, '.pnpm/$1' );
}

module.exports = {
	fixPnpmPaths,
};
