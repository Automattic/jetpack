/**
 * Extracts a user-facing message from a thrown value, with a safe fallback for
 * shapes that don't carry a string `message`.
 *
 * @param error    - The thrown value (Error, REST error object, or unknown).
 * @param fallback - Translated message to use when no string message is found.
 * @return           A string suitable for rendering in a Notice or aria-label.
 */
export const parseErrorMessage = ( error: unknown, fallback: string ): string => {
	const message = ( error as { message?: unknown } )?.message;
	return typeof message === 'string' ? message : fallback;
};
