/**
 * External dependencies
 */
import child_process from 'child_process';
import path from 'path';

/**
 * Entry point for the CLI.
 *
 * @param {object} argv - The argv for the command line.
 */
export async function cliCli( argv ) {
	if ( argv.command === 'init' ) {
		child_process.spawnSync( 'yarn link', {
			cwd: path.resolve( `tools/cli` ),
			shell: true,
			stdio: 'inherit',
		} );
		child_process.spawnSync( 'yarn link jetpack-cli', {
			shell: true,
			stdio: 'inherit',
		} );
	}
}

/**
 * Command definition for the build subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 *
 * @returns {object} Yargs with the build commands defined.
 */
export function cliDefine( yargs ) {
	yargs.command(
		'cli [command]',
		'Tools for the CLI tool. Meta, eh?',
		yarg => {
			yarg.positional( 'init', {
				describe: 'Ensures the CLI is symlinked so any development is reflected live.',
				type: 'boolean',
			} );
		},
		async argv => {
			await cliCli( argv );
			if ( argv.v ) {
				console.log( argv );
			}
		}
	);

	return yargs;
}
