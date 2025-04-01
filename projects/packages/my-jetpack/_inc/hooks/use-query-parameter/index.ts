/**
 * React hook to get a specific query parameter value from the URL.
 *
 * @param {string} paramName - The name of the query parameter to retrieve.
 * @return {string | null} The value of the query parameter or null if not present.
 */
export function useQueryParameter( paramName: string ): string | null {
	// Get the current URL query string.
	const queryString = window.location.search;

	// Parse the query string into a URLSearchParams object.
	const searchParams = new URLSearchParams( queryString );

	// Return the parameter value, or null if not present.
	return searchParams.has( paramName ) ? searchParams.get( paramName ) : null;
}
