/**
 * Webpack loader that rewrites the `keyedReducer` named import of
 * `@wordpress/data` to a local copy bundled with the polyfill.
 *
 * `@wordpress/notices` >= 5.45.0 imports `keyedReducer` from `@wordpress/data`
 * (consolidated upstream in `@wordpress/data` 10.45.0; see
 * WordPress/gutenberg#77364). The polyfill externalizes `@wordpress/data` to
 * the runtime `window.wp.data` global so the notices store registers in the
 * shared registry. On sites that still ship an older `@wordpress/data`
 * (current WordPress Core), `window.wp.data.keyedReducer` is `undefined` and
 * the bundle throws at load time.
 *
 * This loader leaves every other `@wordpress/data` named import untouched so
 * those continue to be resolved against the runtime global. The DEP plugin's
 * `externals` callback runs before module resolution, which means a
 * `Rule.resolve.alias` mapping for `@wordpress/data` is bypassed for the
 * externalized request. Rewriting the import in source — before webpack sees
 * the request — is the only path that survives the externals pipeline.
 */

/* global __dirname */

const path = require( 'path' );

const LOCAL_PATH = path.resolve( __dirname, 'src/internal/keyed-reducer.js' );

/**
 * Rewrites `import { keyedReducer } from '@wordpress/data'` (alone or
 * combined with other named imports) so `keyedReducer` resolves to the local
 * shim while every other name continues to resolve to `@wordpress/data`.
 *
 * Bails out without changes when the import does not include `keyedReducer`
 * or when the import shape isn't a simple named-imports list (we don't try to
 * be clever about renames or namespace imports — there are none in the
 * affected upstream files, and a loud miss is preferable to a quiet rewrite).
 *
 * @param {string} source - Source code of the matched module.
 * @return {string} Rewritten source.
 */
module.exports = function wpDataKeyedReducerLoader( source ) {
	const importRegex = /import\s*\{\s*([^}]+?)\s*\}\s*from\s*(['"])@wordpress\/data\2\s*;?/g;
	const localImport = `import { keyedReducer } from ${ JSON.stringify( LOCAL_PATH ) };`;

	return source.replace( importRegex, ( match, namedList, quote ) => {
		const names = namedList
			.split( ',' )
			.map( n => n.trim() )
			.filter( Boolean );
		if ( ! names.includes( 'keyedReducer' ) ) {
			return match;
		}
		const remaining = names.filter( n => n !== 'keyedReducer' );
		if ( remaining.length === 0 ) {
			return localImport;
		}
		const remainingImport = `import { ${ remaining.join(
			', '
		) } } from ${ quote }@wordpress/data${ quote };`;
		return `${ remainingImport } ${ localImport }`;
	} );
};
