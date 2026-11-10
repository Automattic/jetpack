/**
 * One copy per library for the Jest module registry.
 *
 * pnpm installs a package once per peer-dependency set, and `@wordpress/dataviews`' prerelease
 * carries its own `@wordpress/components`, so a single test file can load five copies of the same
 * library — each one re-read, re-compiled and re-held for every test file. Mapping each name to one
 * copy halves the registry, and keeps `@wordpress/data`'s store registry a singleton.
 */

const path = require( 'path' );
const { forceEsmPackages } = require( 'jetpack-js-tools/jest/jest-resolver.js' );

// Where the copies come from: this package's own dependencies, so the suite runs the versions it
// declares. DataViews' prerelease asks for newer `components`/`ui` than that, and does not get them
// here — as in the browser, where WordPress serves one copy whatever a bundled library asked for.
const DEDUPED_PACKAGES = [
	'@wordpress/components',
	'@wordpress/ui',
	'@wordpress/dataviews',
	'@wordpress/data',
	'@wordpress/compose',
	'@wordpress/element',
	'@wordpress/icons',
	'@wordpress/primitives',
	'@wordpress/theme',
	'@wordpress/rich-text',
	// Owns the popup behaviour `@wordpress/ui` builds on: pinning one without the other pairs a
	// control with a second copy's context, and its menus stop taking clicks.
	'@base-ui/react',
];

const escapeRegExp = value => value.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );

/**
 * Resolve one package to the file jest should load for it.
 *
 * The packages the shared resolver loads as ESM take their `import` entry here
 * too, since a mapped path never reaches that resolver. Remove that branch
 * with the resolver's `forceEsmPackages`.
 *
 * @param {string} name - Package name.
 * @param {string} from - Directory to resolve from.
 * @return {string} Absolute path of the module.
 */
function resolveCopy( name, from ) {
	if ( ! forceEsmPackages.has( name ) ) {
		return require.resolve( name, { paths: [ from ] } );
	}
	const packageJson = require.resolve( `${ name }/package.json`, { paths: [ from ] } );
	const entry = require( packageJson ).exports?.[ '.' ]?.import;
	return typeof entry === 'string'
		? path.join( path.dirname( packageJson ), entry )
		: require.resolve( name, { paths: [ from ] } );
}

/**
 * Builds the `moduleNameMapper` entries pinning each library to one copy.
 *
 * @param {string} rootDir - The package root, where resolution starts.
 * @return {Object<string, string>} Mapper entries, keyed by an anchored pattern for the bare import.
 */
function singleCopyModuleMapper( rootDir ) {
	// Anything the package does not depend on directly, such as `@base-ui/react`, is reached through
	// the library that does.
	const searchDirs = [ rootDir ];
	for ( const name of [ '@wordpress/ui', '@wordpress/dataviews', '@wordpress/components' ] ) {
		try {
			searchDirs.push(
				path.dirname( require.resolve( `${ name }/package.json`, { paths: [ rootDir ] } ) )
			);
		} catch {
			// Not installed here; the remaining directories still cover the list.
		}
	}

	const mapper = {};
	for ( const name of DEDUPED_PACKAGES ) {
		for ( const from of searchDirs ) {
			try {
				mapper[ `^${ escapeRegExp( name ) }$` ] = resolveCopy( name, from );
				break;
			} catch {
				// Not reachable from here; try the package root, then leave the import alone.
			}
		}
	}

	return mapper;
}

module.exports = { DEDUPED_PACKAGES, singleCopyModuleMapper };
