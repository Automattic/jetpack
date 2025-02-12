import child_process from 'child_process';
import path from 'path';

/**
 * Command definition for the docs subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @return {object} Yargs with the docs commands defined.
 */
export function docsDefine( yargs ) {
	yargs.command(
		'docs [path] [dest]',
		'Parses PHPDoc documentation from a project and outputs it into a JSON file.',
		yarg => {
			yarg
				.positional( 'path', {
					describe: 'e.g. path to a jetpack-production folder',
					type: 'string',
					default: '.',
				} )
				.positional( 'dest', {
					describe: 'path to where the generated file should be saved',
					type: 'string',
					default: '.',
				} );
		},
		async argv => {
			await docsCli( argv );
			if ( argv.v ) {
				console.log( argv );
			}
		}
	);

	return yargs;
}

/**
 * Handle args for docs command.
 *
 * @param {argv} argv - the arguments passed.
 */
export async function docsCli( argv ) {
	const parser_options = [
		path.resolve( './tools/cli/helpers/doc-parser/runner.php' ),
		argv.path,
		argv.dest,
	];

	let data = child_process.spawnSync( 'php', parser_options, {
		cwd: path.resolve( './' ),
		stdio: [ 'inherit', 'inherit', 'ignore' ],
	} );

	if ( data.status !== 0 ) {
		// Something is wrong, let's try to run composer update.
		console.debug( 'Preparing doc-parser package...' );
		const cwd = path.resolve( './tools/cli/helpers/doc-parser' );
		data = child_process.spawnSync( 'composer', [ 'update' ], {
			cwd,
			stdio: [ 'inherit', 'inherit', 'ignore' ],
		} );
		if ( data.status !== 0 ) {
			// Running composer update didn't help, exiting.
			console.error(
				"Failed to prepare the doc-parser package. Try running 'composer -d " + cwd + " update'."
			);
		} else {
			// Retrying the parser.
			child_process.spawnSync( 'php', parser_options, {
				cwd: path.resolve( './' ),
				stdio: [ 'inherit', 'inherit', 'ignore' ],
			} );
		}
	}
}
