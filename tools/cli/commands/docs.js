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
					'Project in the form of type/name, e.g. plugins/jetpack, or type, e.g. plugins, or "all"',
				type: 'string',
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
	child_process.spawnSync(
		'php',
		[
			path.resolve( './projects/packages/doc-parser/runner.php' ),
			path.resolve( `./projects/plugins/${ argv.$0 }` ),
		],
		{
			cwd: path.resolve( './' ),
			shell: true,
			stdio: 'inherit',
		}
	);
}
