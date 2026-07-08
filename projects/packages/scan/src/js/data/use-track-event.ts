import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useCallback } from '@wordpress/element';

/**
 * Returns a stable callback for emitting `jetpack_scan_*` Tracks events
 * from the Scan overview UI. Thin wrapper around
 * `@automattic/jetpack-analytics` (the canonical Jetpack tracking
 * client used by Forms, Backup, Activity Log, and the rest of the
 * wp-admin product surface) so call sites don't need to know which
 * underlying transport is in play.
 *
 * @return Stable callback that records a tracks event by name with optional properties.
 */
export function useTrackEvent() {
	return useCallback( ( eventName: string, properties?: Record< string, unknown > ) => {
		jetpackAnalytics.tracks.recordEvent( eventName, properties );
	}, [] );
}
