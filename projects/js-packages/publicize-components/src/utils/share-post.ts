/**
 * Whether the response is an error response.
 *
 * @param {unknown} response - The response to check.
 * @return {boolean} Whether the response is an error response.
 */
export function isErrorResponse( response: unknown ): boolean {
	if ( ! response || typeof response !== 'object' ) {
		return false;
	}

	// Errors coming from the API.
	const hasErrorCode = 'code' in response && typeof response.code === 'string';

	/*
	 * Errors coming from the external services,
	 * through the REST API in dotcom.
	 * e.g. Tumblr, Facebook, Twitter, etc.
	 */
	const hasSharingErrors =
		'errors' in response && Array.isArray( response.errors ) && response.errors.length > 0;

	return hasErrorCode || hasSharingErrors;
}
