const { dirname, join } = require( 'path' );

// Some packages assume that a "browser" environment is esm or otherwise break in node.
// List them here and the resolver will adjust the conditions to resolve them as "node" instead.
// cf. https://github.com/microsoft/accessibility-insights-web/pull/5421#issuecomment-1109168149
const badBrowserPackages = new Set( [
	// https://github.com/LeaVerou/parsel/issues/79
	'parsel-js',
] );

/**
 * Load these packages as ESM: their CommonJS builds snapshot a circular
 * import as `undefined`. `transform-ignore.js` lets babel-jest transpile them.
 * Remove once WordPress/gutenberg#86322 and #86323 ship.
 *
 * @see https://github.com/WordPress/gutenberg/pull/86322
 * @see https://github.com/WordPress/gutenberg/pull/86323
 */
const forceEsmPackages = new Set( [ '@wordpress/components', '@wordpress/block-editor' ] );

/**
 * Custom jest resolver, adjusting resolution for some packages that break in jest.
 *
 * @param {string} path    - Path to the module.
 * @param {object} options - Jest resolver options, including `defaultResolver` and `conditions`.
 * @return {string} Resolved path.
 */
module.exports = ( path, options ) => {
	const basedir = options.basedir;
	const conditions = options.conditions ? new Set( options.conditions ) : options.conditions;

	// Adjust conditions for certain packages that assume "browser" is esm.
	const pkg = path
		.split( '/' )
		.slice( 0, path.startsWith( '@' ) ? 2 : 1 )
		.join( '/' );
	if ( conditions && conditions.has( 'browser' ) && badBrowserPackages.has( pkg ) ) {
		conditions.delete( 'browser' );
		conditions.add( 'node' );
	}
	if ( conditions && forceEsmPackages.has( pkg ) ) {
		conditions.delete( 'require' );
		conditions.add( 'import' );
	}

	const resolver = options.defaultResolver;
	const opts = {
		...options,
		basedir,
		conditions: conditions ? [ ...conditions ] : conditions,
	};

	return resolver( path, opts );
};

/**
 * Resolve the file a `moduleNameMapper` entry should point at.
 *
 * A mapped path skips the resolver above, so `forceEsmPackages` take their
 * `import` entry here. Remove with that list, back to `require.resolve`.
 *
 * @param {string} name - Package name.
 * @param {string} from - Directory to resolve from.
 * @return {string} Absolute path of the module.
 */
module.exports.resolveMapperTarget = ( name, from ) => {
	if ( forceEsmPackages.has( name ) ) {
		const packageJson = require.resolve( `${ name }/package.json`, { paths: [ from ] } );
		const entry = require( packageJson ).exports?.[ '.' ]?.import;
		if ( typeof entry === 'string' ) {
			return join( dirname( packageJson ), entry );
		}
	}
	return require.resolve( name, { paths: [ from ] } );
};
