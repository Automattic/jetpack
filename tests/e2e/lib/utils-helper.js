/**
 * External dependencies
 */
import { execSync, exec } from 'child_process';

/**
 * Executes a shell command and return it as a Promise.
 * @param {string} cmd  shell command
 * @return {Promise<string>} output
 */
export function execShellCommand( cmd ) {
	return new Promise( resolve => {
		const cmdExec = exec( cmd, ( error, stdout, stderr ) => {
			if ( error ) {
				console.warn( error );
			}
			return resolve( stdout ? stdout : stderr );
		} );
		cmdExec.stdout.pipe( process.stdout );
		cmdExec.stdout.on( 'data', function( data ) {
			console.log( data );
		} );
	} );
}

export function execSyncShellCommand( cmd ) {
	return execSync( cmd ).toString();
}

export async function getNgrokSiteUrl() {
	const cmd =
		'echo $(curl -s localhost:4040/api/tunnels/command_line | jq --raw-output .public_url)';
	console.log( 'getNgrokSiteUrl' );
	const out = await execShellCommand( cmd );

	console.log( out );
	return out;
}
