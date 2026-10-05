import { useCallback } from 'react';
import useAnalytics from '../use-analytics';
import type { ConnectionErrorTrackingCallback } from '@automattic/jetpack-connection';

/**
 * Whether an event name is in the namespace My Jetpack's `recordEvent` accepts.
 *
 * @param {string} event - The event name.
 * @return {boolean} Whether it is `jetpack_`-prefixed.
 */
function isJetpackEvent( event: string ): event is `jetpack_${ string }` {
	return event.startsWith( 'jetpack_' );
}

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
			if ( event && isJetpackEvent( event ) ) {
				recordEvent( event, data );
			}
		},
		[ recordEvent ]
	);
}
