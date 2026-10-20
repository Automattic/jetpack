import jetpackAnalytics from '@automattic/jetpack-analytics';

declare global {
	interface Window {
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
 * Record a Tracks event. Does nothing visible when PHP didn't load the Tracks script.
 *
 * @param eventName  - The event name, prefixed `jetpack_`.
 * @param properties - Event properties.
 */
export function recordEvent( eventName: string, properties?: Record< string, unknown > ): void {
	identify();
	jetpackAnalytics.tracks.recordEvent( eventName, properties );
}
