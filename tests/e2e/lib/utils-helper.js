/**
 * External dependencies
 */
import { execSync, exec, execFile } from 'child_process';

/**
 * Executes a shell command and return it as a Promise.
 * @param {string} cmd  shell command
 * @return {Promise<string>} output
 */
export async function execShellCommand( cmd ) {
	return await new Promise( resolve => {
		const cmdExec = exec( cmd, ( error, stdout, stderr ) => {
			if ( error ) {
				console.log( '!!! ERROR' );

				console.warn( error );
			}
			return resolve( stdout ? stdout : stderr );
		} );
		cmdExec.stdout.on( 'data', data => console.log( data ) );
		cmdExec.stderr.on( 'data', data => console.log( 'ERR: ' + data ) );
	} );
}

export async function execShellFile( file, opts ) {
	return await new Promise( resolve => {
		const cmdExec = execFile( file, opts, ( error, stdout, stderr ) => {
			if ( error ) {
				console.log( '!!! ERROR' );

				console.warn( error );
			}
			return resolve( stdout ? stdout : stderr );
		} );
		cmdExec.stdout.on( 'data', data => console.log( data ) );
		cmdExec.stderr.on( 'data', data => console.log( 'ERR: ' + data ) );
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
