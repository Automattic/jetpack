import { useCallback } from 'react';
import useAnalytics from '../use-analytics';
import type { ConnectionErrorTrackingCallback } from '@automattic/jetpack-connection';

/**
 * Tracking callback for the connection package's error events, routed through
 * My Jetpack's analytics.
 *
 * Only `jetpack_`-prefixed events are recorded: an error's `tracking_event` is
 * server-supplied, and My Jetpack's `recordEvent` only accepts that namespace.
 *
 * @return {ConnectionErrorTrackingCallback} A stable callback for `useConnectionErrorNotice`.
 */
export default function useConnectionErrorTracking(): ConnectionErrorTrackingCallback {
	const { recordEvent } = useAnalytics();

	return useCallback(
		( event, data ) => {
			if ( event && event.startsWith( 'jetpack_' ) ) {
				recordEvent( event as `jetpack_${ string }`, data );
			}
		},
		[ recordEvent ]
	);
}
