// Some packages assume that a "browser" environment is esm or otherwise break in node.
// List them here and the resolver will adjust the conditions to resolve them as "node" instead.
// cf. https://github.com/microsoft/accessibility-insights-web/pull/5421#issuecomment-1109168149
const badBrowserPackages = new Set( [
	// https://github.com/LeaVerou/parsel/issues/79
	'parsel-js',
] );

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

	const resolver = options.defaultResolver;
	const opts = {
		...options,
		basedir,
		conditions,
	};

	return resolver( path, opts );
};
