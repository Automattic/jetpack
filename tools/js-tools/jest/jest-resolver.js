// Some packages assume that a "browser" environment is esm or otherwise break in node.
// List them here and the resolver will adjust the conditions to resolve them as "node" instead.
// cf. https://github.com/microsoft/accessibility-insights-web/pull/5421#issuecomment-1109168149
const badBrowserPackages = new Set( [
	// Supposedly fixed in v9: https://github.com/uuidjs/uuid/pull/616#issuecomment-1237428554
	'uuid',
] );

module.exports = ( path, options ) => {
	const basedir = options.basedir;
	const conditions = options.conditions ? new Set( options.conditions ) : options.conditions;

	// Adjust conditions for certain packages that assume "browser" is esm.
	if ( conditions && conditions.has( 'browser' ) && badBrowserPackages.has( path ) ) {
		conditions.delete( 'browser' );
		conditions.add( 'node' );
	}

	return options.defaultResolver( path, {
		...options,
		basedir,
		conditions,
	} );
};
