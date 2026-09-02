/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { getScriptData } from '@automattic/jetpack-script-data';
import { useCallback } from '@wordpress/element';

// The tracker is a module singleton, so identify it once per identity rather than
// on every consumer's mount.
let identifiedFor: string | null = null;

/**
 * Attaches the connected WPCOM identity to the tracker, at most once per identity.
 */
function identifyOnce() {
	const wpcomUser = getScriptData()?.user?.current_user?.wpcom;

	if ( ! wpcomUser?.ID || ! wpcomUser?.login ) {
		return;
	}

	const key = `${ wpcomUser.ID }:${ wpcomUser.login }`;

	if ( identifiedFor === key ) {
		return;
	}

	jetpackAnalytics.initialize( wpcomUser.ID, wpcomUser.login );
	identifiedFor = key;
}

/**
 * Returns a stable callback for emitting `jetpack_premium_analytics_*` Tracks events,
 * matching the wrapper Scan and Activity Log use over `@automattic/jetpack-analytics`.
 *
 * Events still fire before the WPCOM identity resolves; identifying only fills in
 * who they belong to.
 *
 * @return Callback recording a Tracks event by name, with optional properties.
 */
export function useTrackEvent() {
	return useCallback( ( eventName: string, properties?: Record< string, unknown > ) => {
		identifyOnce();

		const blogId = getScriptData()?.site?.wpcom?.blog_id;

		jetpackAnalytics.tracks.recordEvent( eventName, {
			...( blogId ? { blog_id: blogId } : {} ),
			...properties,
		} );
	}, [] );
}
