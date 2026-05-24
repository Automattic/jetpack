// Opt-in mock mode for designing and QAing the Scan overview without a
// real Jetpack connection or a Scan plan on the site. Activate by adding
// `?jps-mock=1` to the wp-admin URL (query string is preserved across
// the hash router's navigation).
//
// When active:
// - `Gates` skip the connection + capabilities check and render the
//   overview directly.
// - The `fetchers.ts` functions return the fixtures from `./fixtures`
//   instead of hitting `/jetpack/v4/site/scan/*`.

export const MOCK_URL_PARAM = 'jps-mock';

/**
 * Whether mock mode is active in the current page load.
 *
 * @return True when the `?jps-mock=1` query param is present.
 */
export function isMockMode(): boolean {
	if ( typeof window === 'undefined' ) {
		return false;
	}
	try {
		return new URLSearchParams( window.location.search ).has( MOCK_URL_PARAM );
	} catch {
		return false;
	}
}

export * from './fixtures';
