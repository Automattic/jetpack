/* eslint-disable jsdoc/require-description, jsdoc/require-returns */

// Opt-in mock mode for designing and QAing the Backup overview without
// a real Jetpack connection or a backup plan on the site. Activate by
// adding `?jpb-mock=1` to the wp-admin URL (query string is preserved
// across the hash router's navigation).
//
// When active:
// - `Gates` skip the connection + capabilities check and render the
//   Overview directly.
// - The `fetchers.ts` functions return the fixtures from `./fixtures`
//   instead of hitting `/jetpack/v4/*`.
// - `BackupNowButton`'s enqueue mutation succeeds locally without
//   touching the server.

export const MOCK_URL_PARAM = 'jpb-mock';

/**
 *
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
