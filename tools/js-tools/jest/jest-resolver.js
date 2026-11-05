// Some packages assume that a "browser" environment is esm or otherwise break in node.
// List them here and the resolver will adjust the conditions to resolve them as "node" instead.
// cf. https://github.com/microsoft/accessibility-insights-web/pull/5421#issuecomment-1109168149
const badBrowserPackages = new Set( [
	// https://github.com/LeaVerou/parsel/issues/79
	'parsel-js',
] );

/**
 * Load these packages as ESM: their CommonJS builds snapshot a circular
 * import as `undefined`. Remove once WordPress/gutenberg#86322 and #86323 ship.
 *
 * @see https://github.com/WordPress/gutenberg/pull/86322
 * @see https://github.com/WordPress/gutenberg/pull/86323
 */
const ESM_PACKAGES = new Set( [ '@wordpress/components', '@wordpress/block-editor' ] );

/**
 * Resolve a module, through its ESM entry for the packages listed above.
 *
 * @param {string} path    - Path to the module.
 * @param {object} options - Jest resolver options, including `defaultResolver` and `conditions`.
 * @return {string} Resolved path.
 */
module.exports = ( path, options ) => {
	if ( ESM_PACKAGES.has( path ) ) {
		return options.defaultResolver( path, {
			...options,
			conditions: [ ...( options.conditions ?? [] ), 'import' ],
		} );
	}

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

	const resolver = options.defaultResolver;
	const opts = {
		...options,
		basedir,
		conditions: conditions ? [ ...conditions ] : conditions,
	};

	return resolver( path, opts );
};

module.exports.ESM_PACKAGES = ESM_PACKAGES;
