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
