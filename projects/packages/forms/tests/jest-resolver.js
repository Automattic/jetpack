// Hack so the ESM-only `@wordpress/interactivity` can be used with Jest in CommonJS mode.
// @todo Run Jest in ESM mode so this isn't needed.

const resolver = require( 'jetpack-js-tools/jest/jest-resolver.js' );

module.exports = ( path, options ) => {
	if ( ! options.conditions ) {
		return resolver( path, options );
	}

	const conditions = new Set( options.conditions );

	// `@wordpress/interactivity` is ESM-only, while Babel transformation tries to `require` it.
	// Override the conditions so the resolver can find a version for Babel to transpile.
	if ( path === '@wordpress/interactivity' && conditions.has( 'require' ) ) {
		conditions.delete( 'require' );
		conditions.add( 'import' );
	}

	return resolver( path, { ...options, conditions: [ ...conditions ] } );
};
