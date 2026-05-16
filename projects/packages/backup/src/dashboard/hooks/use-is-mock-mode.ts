const MOCK_URL_PARAM = 'jpb-mock';

/**
 * Hook returning whether the dashboard should use fixture data.
 *
 * Reads the `?jpb-mock` query parameter from the current URL on every call,
 * so client-side navigation that drops the param (e.g. a `<Link to="/">`
 * back to the overview) flips the answer back to `false` as expected.
 *
 * @return True when mock mode is active (`?jpb-mock=1`).
 */
export function useIsMockMode(): boolean {
	if ( typeof window === 'undefined' ) {
		return false;
	}
	try {
		return new URLSearchParams( window.location.search ).has( MOCK_URL_PARAM );
	} catch {
		return false;
	}
}
