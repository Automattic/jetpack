// Some packages assume that a "browser" environment is esm or otherwise break in node.
// List them here and the resolver will adjust the conditions to resolve them as "node" instead.
// cf. https://github.com/microsoft/accessibility-insights-web/pull/5421#issuecomment-1109168149
const badBrowserPackages = new Set( [
	// https://github.com/LeaVerou/parsel/issues/79
	'parsel-js',
] );

// TypeScript looks for various different extensions on imports. We need to reproduce this here.
// Based on code from https://github.com/VitorLuizC/ts-jest-resolver/blob/98fdae29c6622ae67f2e10ecc03af7f79d16d24d/src/index.ts
// (which doesn't seem to handle tsc's --jsx option)
const resolutions = [
	{
		matcher: /\.js$/i,
		extensions: [ '.ts', '.tsx', '.js', '.jsx' ],
	},
	{
		matcher: /\.jsx$/i,
		extensions: [ '.tsx', '.ts', '.jsx', '.js' ],
	},
	{
		matcher: /\.cjs$/i,
		extensions: [ '.cts', '.cjs' ],
	},
	{
		matcher: /\.mjs$/i,
		extensions: [ '.mts', '.mjs' ],
	},
];

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

	// Try mapping extensions.
	// Based on code from https://github.com/VitorLuizC/ts-jest-resolver/blob/98fdae29c6622ae67f2e10ecc03af7f79d16d24d/src/index.ts
	const resolver = options.defaultResolver;
	const resolution = resolutions.find( ( { matcher } ) => matcher.test( path ) );
	const opts = {
		...options,
		basedir,
		conditions,
	};

	if ( resolution ) {
		let ex;
		for ( const extension of resolution.extensions ) {
			const trypath = path.replace( resolution.matcher, extension );
			try {
				return resolver( trypath, opts );
			} catch ( e ) {
				if ( trypath === path ) {
					ex = e;
				}
			}
		}
		if ( ex ) {
			throw ex;
		}
	}

	return resolver( path, opts );
};
