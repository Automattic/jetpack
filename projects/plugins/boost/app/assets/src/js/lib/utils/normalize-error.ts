/**
 * Given a thrown object or string, ensure it's an Error object.
 *
 * @param {unknown} err The error to normalize.
 */
export function normalizeError( err: unknown ) {
	if ( err instanceof Error ) {
		return err;
	}

	if ( typeof err === 'string' ) {
		return new Error( err );
	}

	return new Error( 'Unknown error' );
}
