/**
 * Detects Protect's mock-mode flag (?jpprotect-mock=1). Separate from
 * Scan's `?jps-mock=1` so each plugin can iterate without colliding.
 *
 * Per spec: if both `?jpprotect-mock=1` and `?jps-mock=1` are present,
 * Protect honors only its own flag.
 */
export const MOCK_URL_PARAM = 'jpprotect-mock';

/**
 * Whether Protect's mock mode is active in the current page load.
 *
 * @return True when the `?jpprotect-mock=1` query param is present.
 */
export function isProtectMockMode(): boolean {
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
