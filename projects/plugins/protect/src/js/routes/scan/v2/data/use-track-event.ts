import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useCallback } from '@wordpress/element';

/**
 * Returns a stable callback for emitting `jetpack_protect_scan_*` Tracks
 * events from the Protect Scan v2 surface. Thin wrapper around
 * `@automattic/jetpack-analytics` (the canonical Jetpack tracking
 * client used by Forms, Backup, Activity Log, and the rest of the
 * wp-admin product surface) so call sites don't need to know which
 * underlying transport is in play.
 *
 * Mirrors `packages/scan/src/js/data/use-track-event.ts` deliberately
 * — keeping the API identical means hooks ported from `packages/scan`
 * in later phases compile here without translation.
 *
 * @return Stable callback that records a tracks event by name with optional properties.
 */
export function useTrackEvent() {
	return useCallback( ( eventName: string, properties?: Record< string, unknown > ) => {
		jetpackAnalytics.tracks.recordEvent( eventName, properties );
	}, [] );
}
