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

	// If any of the execa promises reject during the `yield*`, node will decide they're "unhandled" and exit ignoring any
	// parent catch. So we need to catch any errors manually, then re-throw them after.
	let err;
	const promises = [];
	const doSpawn = ( cmd, args, options ) => {
		const proc = spawn( cmd, args, options );
		promises.push( proc.catch( e => ( err ||= e ) ) );
		return proc;
	};

	// Create the `ls-files` process.
	const lsFiles = doSpawn( 'git', [ '-c', 'core.quotepath=off', 'ls-files' ], {
		cwd: src,
		stdio: [ 'ignore', 'pipe', 'inherit' ],
		buffer: false,
	} );

	// Create the `| check-attr production-exclude | filter` part.
	const checkAttrExclude = doSpawn(
		'git',
		[ '-c', 'core.quotepath=off', 'check-attr', '--stdin', 'production-exclude' ],
		{
			cwd: src,
			stdio: [ 'pipe', 'pipe', 'inherit' ],
			buffer: false,
		}
	);

	const filterProductionExclude = new FilterStream(
		s => s.match( /^(.*): production-exclude: (?:unspecified|unset)/ )?.[ 1 ]
	);

	// Only after the `ls-files` part finishes can we create the `ls-files --ignored | check-attr production-include | filter` part
	// and then connect it to the `| check-attr production-exclude | filter` part.
	// If we create it earlier, and it finishes first, node loses all the output.
	lsFiles.stdout.on( 'end', () => {
		const lsIgnoredFiles = doSpawn(
			'git',
			[ '-c', 'core.quotepath=off', 'ls-files', '--others', '--ignored', '--exclude-standard' ],
			{ cwd: src, stdio: [ 'ignore', 'pipe', 'inherit' ], buffer: false }
		);

		const checkAttrInclude = doSpawn(
			'git',
			[ '-c', 'core.quotepath=off', 'check-attr', '--stdin', 'production-include' ],
			{
				cwd: src,
				stdio: [ lsIgnoredFiles.stdout, 'pipe', 'inherit' ],
				buffer: false,
			}
		);

		const filterProductionInclude = new FilterStream(
			s => s.match( /^(.*): production-include: (?!unspecified|unset)/ )?.[ 1 ]
		);

		checkAttrInclude.stdout
			.pipe( filterProductionInclude )
			.pipe( checkAttrExclude.stdin, { end: true } );
	} );

	// Connect the `ls-files` part to the `| check-attr production-exclude | filter` part.
	lsFiles.stdout.pipe( checkAttrExclude.stdin, { end: false } );

	// Yield the output of the `check-attr production-exclude | filter` part line by line.
	yield* readline.createInterface( {
		input: checkAttrExclude.stdout.pipe( filterProductionExclude ),
		crlfDelay: Infinity,
	} );

	// Wait for all the promises created above, then rethrow any error.
	await Promise.all( promises );
	if ( err ) {
		throw err;
	}
}
