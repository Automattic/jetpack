import { useCallback } from '@wordpress/element';
import useAnalytics from '../hooks/useAnalytics';

/**
 * Returns an `onTrackEvent` callback compatible with the file-browser
 * components' optional analytics prop. Wraps the existing
 * `useAnalytics().tracks.recordEvent` so file-browser nodes don't need
 * a direct dependency on the analytics module.
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
