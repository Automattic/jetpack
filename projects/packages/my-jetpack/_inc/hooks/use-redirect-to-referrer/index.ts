/**
 * React custom hook to get the request referrer URL when `redirect_to_referrer` parameter is present.
 *
 * @returns {string | null} referrer URL or null if not flagged.
 */
export function useRedirectToReferrer() {
	// Get the current URL query string.
	const queryString = window.location.search;

	// Parse the query string into a URLSearchParams object.
	const searchParams = new URLSearchParams( queryString );

	// If there is no redirect_to_referrer parameter or is not 1, return null.
	if ( ! searchParams.has( 'redirect_to_referrer', '1' ) ) {
		return null;
	}

	// Return the referrer URL, or null if referrer is not set.
	return document.referrer !== '' ? document.referrer : null;
}
