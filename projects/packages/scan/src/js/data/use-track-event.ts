import { useCallback } from '@wordpress/element';
import useAnalytics from '../hooks/use-analytics';

/**
 * Returns an `onTrackEvent` callback for emitting `jetpack_scan_*` tracks
 * events from the overview UI. Wraps `useAnalytics().tracks.recordEvent`
 * so call sites don't need a direct dependency on the analytics module.
 *
 * @return Stable callback that records a tracks event by name with optional properties.
 */
export function useTrackEvent() {
	const analytics = useAnalytics();

	return useCallback(
		( eventName: string, properties?: Record< string, unknown > ) => {
			analytics.tracks.recordEvent( eventName, properties );
		},
		[ analytics ]
	);
}
