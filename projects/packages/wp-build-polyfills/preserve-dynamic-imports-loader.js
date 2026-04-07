/**
 * Webpack loader that preserves dynamic import() calls as native browser imports.
 *
 * When webpack encounters `import(variable)` (a dynamic import with a non-string
 * argument), it creates a "context module" stub that always throws
 * "Cannot find module". This is because webpack can't statically determine what
 * module will be loaded at runtime.
 *
 * For packages like `@wordpress/boot` that rely on the browser's import map to
 * resolve module IDs at runtime, these dynamic imports must be preserved as
 * native `import()` calls. This loader adds `webpackIgnore: true` magic comments
 * to such imports, telling webpack to leave them as-is.
 *
 * Only import() calls with variable arguments are affected. String-literal
 * imports like `import("@wordpress/a11y")` are left untouched so that webpack's
 * externals plugin can handle them normally. Dynamic imports with leading
 * comments (e.g. `import(/* webpackChunkName: ... *\/ variable)`) are also
 * handled correctly.
 * @param {string} source - The source code to process.
 * @return {string} - The processed source code.
 */
module.exports = function preserveDynamicImports( source ) {
	return source.replace( /\bimport\(/g, ( match, offset ) => {
		// Scan past whitespace and comments to find the first meaningful character.
		let i = offset + match.length;
		while ( i < source.length ) {
			if ( source[ i ] === '/' && source[ i + 1 ] === '*' ) {
				const end = source.indexOf( '*/', i + 2 );
				i = end === -1 ? source.length : end + 2;
			} else if ( source[ i ] === '/' && source[ i + 1 ] === '/' ) {
				const end = source.indexOf( '\n', i + 2 );
				i = end === -1 ? source.length : end + 1;
			} else if ( /\s/.test( source[ i ] ) ) {
				i++;
			} else {
				break;
			}
		}

		// String-literal imports are left for webpack's externals plugin.
		if ( i < source.length && /['"`]/.test( source[ i ] ) ) {
			return match;
		}

		return 'import(/* webpackIgnore: true */ ';
	} );
};
