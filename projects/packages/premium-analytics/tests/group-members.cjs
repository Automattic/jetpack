/**
 * Parsing of the widget test group files in `widgets/__groups__/`.
 *
 * Both the Jest config and the guard test read the group files, and they must
 * agree on what a group lists: the config keeps every member out of the
 * ungrouped run, and the guard test checks the members are safe to share a
 * module registry. A line one of them silently skipped would run that suite
 * twice — once standalone, once inside its group — while the guard passed
 * vacuously over it, so the parsing lives here once and reports what it could
 * not read instead of dropping it.
 */

const fs = require( 'fs' );
const path = require( 'path' );

const GROUPS_DIR = path.join( __dirname, '..', 'widgets', '__groups__' );

// Group files are suites in their own right, so Jest has to collect them.
const GROUP_FILE = /\.test\.tsx?$/;

// The only statement a group file may carry. Anchored, so an indented or
// otherwise reshaped import is reported rather than skipped.
const MEMBER_IMPORT = /^import '([^']+)';$/;

/**
 * Gets the group file names.
 *
 * @return {string[]} Group file names, sorted for stable test titles.
 */
function groupFileNames() {
	if ( ! fs.existsSync( GROUPS_DIR ) ) {
		return [];
	}
	return fs
		.readdirSync( GROUPS_DIR )
		.filter( name => GROUP_FILE.test( name ) )
		.sort();
}

/**
 * Gets the directory entries that are neither a group file nor its README.
 *
 * A helper or a group saved under another extension is collected by neither
 * side, so name it here rather than let it sit unread.
 *
 * @return {string[]} Unexpected entry names, sorted.
 */
function strayGroupDirEntries() {
	if ( ! fs.existsSync( GROUPS_DIR ) ) {
		return [];
	}
	return fs
		.readdirSync( GROUPS_DIR )
		.filter( name => name !== 'README.md' && ! GROUP_FILE.test( name ) )
		.sort();
}

/**
 * Splits a group file into the suites it imports and the lines it could not read.
 *
 * @param {string} source - Group file contents.
 * @return {{ specifiers: string[], unreadable: string[] }} Imported specifiers, and any other code.
 */
function parseGroupSource( source ) {
	const specifiers = [];
	const unreadable = [];
	let inBlockComment = false;

	for ( const line of source.split( '\n' ) ) {
		const text = line.trim();

		if ( inBlockComment ) {
			inBlockComment = ! text.endsWith( '*/' );
			continue;
		}
		if ( text === '' || text.startsWith( '//' ) ) {
			continue;
		}
		if ( text.startsWith( '/*' ) ) {
			inBlockComment = ! text.endsWith( '*/' );
			continue;
		}

		const match = MEMBER_IMPORT.exec( line );
		if ( match ) {
			specifiers.push( match[ 1 ] );
		} else {
			unreadable.push( text );
		}
	}

	return { specifiers, unreadable };
}

/**
 * Resolves an extensionless suite path against the files on disk.
 *
 * @param {string} member - Extensionless suite path.
 * @return {string|null} The real file, or null when nothing resolves.
 */
function resolveSuite( member ) {
	return [ '.tsx', '.ts' ].map( extension => member + extension ).find( fs.existsSync ) ?? null;
}

/**
 * Reads one group file.
 *
 * @param {string} groupFile - Group file name.
 * @return {{ members: string[], unreadable: string[] }} Absolute extensionless member paths, and any other code.
 */
function readGroup( groupFile ) {
	const source = fs.readFileSync( path.join( GROUPS_DIR, groupFile ), 'utf8' );
	const { specifiers, unreadable } = parseGroupSource( source );

	return {
		members: specifiers.map( specifier => path.resolve( GROUPS_DIR, specifier ) ),
		unreadable,
	};
}

/**
 * Gets every suite listed by a group.
 *
 * @return {string[]} Absolute paths of the member suites that resolve.
 */
function groupedMemberFiles() {
	return groupFileNames().flatMap( groupFile =>
		readGroup( groupFile ).members.map( resolveSuite ).filter( Boolean )
	);
}

module.exports = {
	GROUPS_DIR,
	groupFileNames,
	groupedMemberFiles,
	parseGroupSource,
	readGroup,
	resolveSuite,
	strayGroupDirEntries,
};
