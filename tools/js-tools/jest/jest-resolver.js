const fs = require( 'fs' );
const npath = require( 'path' );

// Some packages assume that a "browser" environment is esm or otherwise break in node.
// List them here and the resolver will adjust the conditions to resolve them as "node" instead.
// cf. https://github.com/microsoft/accessibility-insights-web/pull/5421#issuecomment-1109168149
const badBrowserPackages = new Set( [ 'uuid', 'react-colorful' ] );

const importsCache = new Map();

module.exports = ( path, options ) => {
	let basedir = options.basedir;
	const conditions = options.conditions ? new Set( options.conditions ) : options.conditions;

	// Adjust conditions for certain packages that assume "browser" is esm.
	if ( conditions && conditions.has( 'browser' ) && badBrowserPackages.has( path ) ) {
		conditions.delete( 'browser' );
		conditions.add( 'node' );
	}

	// Handle package.json `imports` by updating the `path` and `basedir`.
	// cf. https://github.com/facebook/jest/issues/12270
	if ( path.startsWith( '#' ) ) {
		// Check `imports`. If found, replace `path` and `basedir`.
		const resolveImports = ( dir, imports ) => {
			switch ( typeof imports ) {
				case 'string':
					path = imports;
					basedir = dir;
					return true;

				case 'object':
					for ( const [ k, v ] of Object.entries( imports ) ) {
						if ( conditions.has( k ) && resolveImports( dir, v ) ) {
							return true;
						}
					}
					break;
			}
			return false;
		};

		// Find nearest package.json
		const dirs = new Set();
		for (
			let olddir = null, dir = basedir;
			dir !== olddir;
			olddir = dir, dir = npath.dirname( dir )
		) {
			if ( importsCache.has( dir ) ) {
				const [ cdir, imports ] = importsCache.get( dir );
				resolveImports( cdir, imports[ path ] );
				break;
			}

			dirs.add( dir );
			const file = npath.join( dir, 'package.json' );
			if ( fs.existsSync( file ) ) {
				const imports = JSON.parse( fs.readFileSync( file, { encoding: 'utf8' } ) ).imports;
				const ce = [ dir, imports ];
				for ( const d of dirs ) {
					importsCache.set( d, ce );
				}
				resolveImports( dir, imports[ path ] );
				break;
			}
		}
	}

	return options.defaultResolver( path, {
		...options,
		basedir,
		conditions,
	} );
};
