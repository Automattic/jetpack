/**
 * External dependencies
 */
import child_process from 'child_process';

/**
 * Runs the actual command.
 *
 * @param {string} cmd - the shell command to run.
 * @param {Array} options - the command options passed.
 */
export async function runCommand( cmd, options ) {
	const data = child_process.spawnSync( cmd, [ ...options ], {
		shell: true,
		stdio: 'inherit',
	} );
	// Node.js exit code status 0 === success
	if ( data.status !== 0 ) {
		console.error( 'There was a problem! See error above.' );
		process.exit( data.status );
	}
}
