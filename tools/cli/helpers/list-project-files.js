import readline from 'readline';
import FilterStream from './filter-stream.js';

/**
 * List project files to be mirrored.
 *
 * @param {string} src - Source directory.
 * @param {Function} spawn - `execa` spawn function.
 * @yields {string} File name.
 */
export async function* listProjectFiles( src, spawn ) {
	// Lots of process plumbing going on here.
	//  {
	//    ls-files
	//    ls-files --ignored | check-attr production-include | filter
	//  } | check-attr production-exclude | filter

	const lsFiles = spawn( 'git', [ '-c', 'core.quotepath=off', 'ls-files' ], {
		cwd: src,
		stdio: [ 'ignore', 'pipe', null ],
		buffer: false,
	} );
	const lsIgnoredFiles = spawn(
		'git',
		[ '-c', 'core.quotepath=off', 'ls-files', '--others', '--ignored', '--exclude-standard' ],
		{ cwd: src, stdio: [ 'ignore', 'pipe', null ], buffer: false }
	);
	const checkAttrInclude = spawn(
		'git',
		[ '-c', 'core.quotepath=off', 'check-attr', '--stdin', 'production-include' ],
		{
			cwd: src,
			stdio: [ lsIgnoredFiles.stdout, 'pipe', null ],
			buffer: false,
		}
	);
	const checkAttrExclude = spawn(
		'git',
		[ '-c', 'core.quotepath=off', 'check-attr', '--stdin', 'production-exclude' ],
		{
			cwd: src,
			stdio: [ 'pipe', 'pipe', null ],
			buffer: false,
		}
	);
	const filterProductionInclude = new FilterStream(
		s => s.match( /^(.*): production-include: (?!unspecified|unset)/ )?.[ 1 ]
	);
	const filterProductionExclude = new FilterStream(
		s => s.match( /^(.*): production-exclude: (?:unspecified|unset)/ )?.[ 1 ]
	);

	// Pipe lsFiles to checkAttrExclude first, then lsIgnoredFiles+checkAttrInclude+filterProductionInclude after that.
	lsFiles.stdout.on( 'end', () => {
		// prettier-ignore
		checkAttrInclude.stdout
			.pipe( filterProductionInclude )
			.pipe( checkAttrExclude.stdin, { end: true } );
	} );
	lsFiles.stdout.pipe( checkAttrExclude.stdin, { end: false } );

	const rl = readline.createInterface( {
		input: checkAttrExclude.stdout.pipe( filterProductionExclude ),
		crlfDelay: Infinity,
	} );

	// Apparently if any of the execa promises reject during the `yield*`, node will decide they're "unhandled" and exit ignoring any
	// parent catch. So we need to catch any errors manually, then re-throw them after.
	let err;
	for ( const proc of [ lsFiles, lsIgnoredFiles, checkAttrInclude, checkAttrExclude ] ) {
		proc.catch( e => ( err ||= e ) );
	}

	// Return each line from the generator.
	yield* rl;

	// Wait for processes, then rethrow any error.
	await Promise.all( [ lsFiles, lsIgnoredFiles, checkAttrInclude, checkAttrExclude ] );
	if ( err ) {
		throw err;
	}
}
