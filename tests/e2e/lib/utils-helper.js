/**
 * External dependencies
 */
import { execSync } from 'child_process';

/**
 * Executes a shell command and return it as a Promise.
 * @param {string} cmd  shell command
 * @return {Promise<string>} output
 */
export function execShellCommand( cmd ) {
	const exec = require( 'child_process' ).exec;
	return new Promise( resolve => {
		exec( cmd, ( error, stdout, stderr ) => {
			if ( error ) {
				console.warn( error );
			}
			return resolve( stdout ? stdout : stderr );
		} );
	} );
}

export function execSyncShellCommand( cmd ) {
	return execSync( cmd );
}

export async function getNgrokSiteUrl() {
	const cmd =
		'echo $(curl -s localhost:4040/api/tunnels/command_line | jq --raw-output .public_url)';
	console.log( 'getNgrokSiteUrl' );
	const out = await execShellCommand( cmd );

	console.log( out );
	return out;
}
