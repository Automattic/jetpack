/**
 * React custom hook to get the redirect_to parameter from the current URL.
 *
 * @returns {string | null} redirect_to parameter or null if not present
 */
export function useRedirectTo() {
	// Get the current URL query string.
	const queryString = window.location.search;

	// If there is no query string, return null.
	if ( ! queryString ) {
		return null;
	}

	// Parse the query string into a URLSearchParams object.
	const searchParams = new URLSearchParams( queryString );

	// If there is no redirect_to parameter, return null.
	if ( ! searchParams.has( 'redirect_to' ) ) {
		return null;
	}

	// Return the redirect_to parameter.
	return searchParams.get( 'redirect_to' );
}
