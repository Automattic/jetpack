import child_process from 'child_process';
import path from 'path';

/**
 * Command definition for the docs subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @returns {object} Yargs with the docs commands defined.
 */
export function docsDefine( yargs ) {
	yargs.command(
		'docs [project]',
		'Parses documentation from a project and outputs them into a JSON file.',
		yarg => {
			yarg.positional( 'project', {
				describe:
					'Project in the form of type/name, e.g. plugins/jetpack, ' +
					'or type, e.g. plugins, or "all". Note that "all" means' +
					'the Jetpack plugin plus all packages.',
				type: 'string',
				default: 'all',
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
 * @param {argv}  argv - the arguments passed.
 */
export async function docsCli( argv ) {
	let paths;
	if ( 'all' === argv.project ) {
		// "All" is a keyword for Jetpack plus packages.

		paths = [ path.resolve( './projects/plugins/jetpack' ), path.resolve( './projects/packages' ) ];
	} else {
		paths = [ path.resolve( `./projects/plugins/${ argv.project }` ) ];
	}

	const parser_options = [ path.resolve( './tools/cli/helpers/doc-parser/runner.php' ), ...paths ];

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
