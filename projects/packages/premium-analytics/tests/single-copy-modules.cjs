/**
 * One copy per library for the Jest module registry.
 *
 * pnpm installs a package once per peer-dependency set, and `@wordpress/dataviews`' prerelease
 * carries its own `@wordpress/components`, so a single test file can load five copies of the same
 * library — each one re-read, re-compiled and re-held for every test file. Mapping each name to one
 * copy halves the registry, and keeps `@wordpress/data`'s store registry a singleton.
 */

const path = require( 'path' );

// Where the copies come from: DataViews' prerelease dependencies name the newest, and its ranges
// accept no older one, so anything resolvable there wins over the package's own resolution.
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
];

const escapeRegExp = value => value.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );

/**
 * Builds the `moduleNameMapper` entries pinning each library to one copy.
 *
 * @param {string} rootDir - The package root, where resolution starts.
 * @return {Object<string, string>} Mapper entries, keyed by an anchored pattern for the bare import.
 */
function singleCopyModuleMapper( rootDir ) {
	let dataviewsDir;
	try {
		dataviewsDir = path.dirname(
			require.resolve( '@wordpress/dataviews/package.json', { paths: [ rootDir ] } )
		);
	} catch {
		dataviewsDir = rootDir;
	}

	const mapper = {};
	for ( const name of DEDUPED_PACKAGES ) {
		for ( const from of [ dataviewsDir, rootDir ] ) {
			try {
				mapper[ `^${ escapeRegExp( name ) }$` ] = require.resolve( name, { paths: [ from ] } );
				break;
			} catch {
				// Not reachable from here; try the package root, then leave the import alone.
			}
		}
	}

	return mapper;
}

module.exports = { DEDUPED_PACKAGES, singleCopyModuleMapper };
