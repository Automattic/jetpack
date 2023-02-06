import child_process from 'child_process';

/**
 * Runs the actual command.
 *
 * @param {string} cmd - the shell command to run.
 * @param {Array} args - Command arguments.
 * @param {object} options - Options for child_process.spawnSync.
 */
export async function runCommand( cmd, args, options = { stdio: 'inherit' } ) {
	const data = child_process.spawnSync( cmd, args, options );
	// Node.js exit code status 0 === success
	if ( data.status !== 0 ) {
		console.error( 'There was a problem! See error above.' );
		process.exit( data.status );
	}
}
