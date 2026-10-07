/**
 * The REST error's own message, or a fallback.
 *
 * @param error    - What apiFetch rejected with.
 * @param fallback - Message when the error carries none.
 * @return Message to show.
 */
export function errorMessage( error: unknown, fallback: string ): string {
	if ( error && typeof error === 'object' && 'message' in error ) {
		const { message } = error as { message: unknown };
		if ( typeof message === 'string' && message ) {
			return message;
		}
	}

	return fallback;
}
