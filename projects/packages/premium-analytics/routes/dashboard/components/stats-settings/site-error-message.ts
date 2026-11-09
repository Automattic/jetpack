// apiFetch writes these itself when the request never reached the site.
const CLIENT_ERROR_CODES = [ 'fetch_error', 'offline_error' ];

/**
 * The reason the site gave for refusing a save, when it gave one.
 *
 * @param error - What apiFetch rejected with: the site's REST error body, or a client-side error.
 * @return The site's message, or null.
 */
export function getSiteErrorMessage( error: unknown ): string | null {
	const { code, message } = ( error ?? {} ) as { code?: unknown; message?: unknown };
	return typeof code === 'string' &&
		! CLIENT_ERROR_CODES.includes( code ) &&
		typeof message === 'string'
		? message
		: null;
}
