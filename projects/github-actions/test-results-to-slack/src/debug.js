/**
 * Prints a debug message to STDOUT in non-testing environments.
 *
 * @param {string} message - The message to print.
 */
export function debug( message ) {
	if ( process.env.NODE_ENV !== 'test' ) {
		process.stdout.write( message + '\n' );
	}
}

/**
 * Prints an error message to STDOUT
 *
 * @param {string} message - The message to print.
 */
export function error( message ) {
	process.stdout.write( message + '\n' );
}
