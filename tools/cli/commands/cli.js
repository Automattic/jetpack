/**
 * External dependencies
 */
import child_process from 'child_process';
import path from 'path';

/**
 * CLI link.
 */
function cliLink() {
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

/**
 * CLI unlink.
 */
function cliUnlink() {
	child_process.spawnSync( 'yarn unlink jetpack-cli', {
		shell: true,
		stdio: 'inherit',
	} );
	child_process.spawnSync( 'yarn unlink', {
		cwd: path.resolve( `tools/cli` ),
		shell: true,
		stdio: 'inherit',
	} );
}

/**
 * Command definition for the build subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 *
 * @returns {object} Yargs with the CLI commands defined.
 */
export function cliDefine( yargs ) {
	yargs.command( 'cli <cmd>', 'Tools for the CLI tool. Meta, eh?', yarg => {
		yarg
			.command(
				'link',
				'Symlink the CLI for global use or development.',
				() => {},
				argv => {
					cliLink();
					if ( argv.v ) {
						console.log( argv );
					}
				}
			)
			.command(
				'unlink',
				'Unlink the CLI.',
				() => {},
				argv => {
					cliUnlink();
					if ( argv.v ) {
						console.log( argv );
					}
				}
			);
	} );

	return yargs;
}
