const MOCK_URL_PARAM = 'jpb-mock';

let cachedValue: boolean | null = null;

/**
 * Read the mock-mode flag from the current URL's query string.
 *
 * @return True when the `?jpb-mock` query parameter is present.
 */
function readFromUrl(): boolean {
	if ( typeof window === 'undefined' ) {
		return false;
	}
	try {
		return new URLSearchParams( window.location.search ).has( MOCK_URL_PARAM );
	} catch {
		return false;
	}
}

/**
 * Hook returning whether the dashboard should use fixture data.
 *
 * The value is read from the URL once and cached for the lifetime of the page,
 * so subsequent calls are cheap and stable across re-renders.
 *
 * @return True when mock mode is active (`?jpb-mock=1`).
 */
export function useIsMockMode(): boolean {
	if ( cachedValue === null ) {
		cachedValue = readFromUrl();
	}
	return cachedValue;
}
