/**
 * Extracts a user-facing message from a thrown value, with a safe fallback for
 * shapes that don't carry a string `message`.
 *
 * @param error    - The thrown value (Error, REST error object, or unknown).
 * @param fallback - Translated message to use when no string message is found.
 * @return           A string suitable for rendering in a Notice or aria-label.
 */
export const parseErrorMessage = ( error: unknown, fallback: string ): string => {
	if ( error instanceof Error ) {
		return error.message;
	}
	if (
		error &&
		typeof error === 'object' &&
		'message' in error &&
		typeof ( error as { message: unknown } ).message === 'string'
	) {
		return ( error as { message: string } ).message;
	}
	return fallback;
};
