import jetpackAnalytics from '@automattic/jetpack-analytics';

declare global {
	interface Window {
		/** Set by PHP when the site and user allow Tracks. */
		jetpackProtectTracks?: boolean;
		/** Printed by PHP only when Tracks is allowed; typed here for the two fields Tracks needs. */
		JP_CONNECTION_INITIAL_STATE?: {
			userConnectionData?: { currentUser?: { wpcomUser?: { ID?: number; login?: string } } };
		};
	}
}

// Module scope, so identifying happens once per page load however many components record events.
let hasIdentified = false;

/**
 * Reset the identify latch. Test-only.
 */
export function resetAnalyticsForTesting(): void {
	hasIdentified = false;
}

/**
 * Identify the connected WordPress.com user to Tracks, once; events stay anonymous without one.
 */
function identify(): void {
	if ( hasIdentified ) {
		return;
	}
	hasIdentified = true;

	const wpcomUser = window.JP_CONNECTION_INITIAL_STATE?.userConnectionData?.currentUser?.wpcomUser;
	if ( wpcomUser?.ID && wpcomUser?.login ) {
		jetpackAnalytics.initialize( wpcomUser.ID, wpcomUser.login );
	}
}

/**
 * Record a Tracks event, unless PHP disallowed Tracks: another plugin's w.js would still send it.
 *
 * @param eventName  - The event name, prefixed `jetpack_`.
 * @param properties - Event properties.
 */
export function recordEvent( eventName: string, properties?: Record< string, unknown > ): void {
	if ( ! window.jetpackProtectTracks ) {
		return;
	}
	identify();
	jetpackAnalytics.tracks.recordEvent( eventName, properties );
}
