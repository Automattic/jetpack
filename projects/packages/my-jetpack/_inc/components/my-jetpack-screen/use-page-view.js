import { useCallback, useLayoutEffect, useRef } from 'react';
import useAdminShellReturn from '../../hooks/use-admin-shell-return';
import useAnalytics from '../../hooks/use-analytics';

/**
 * Record `jetpack_myjetpack_page_view` once the red bubble alerts load, on each tab change, and
 * when the admin shell shows My Jetpack again.
 *
 * @param {string}  currentTab                         - The tab on screen.
 * @param {object}  redBubble                          - The red bubble alerts query.
 * @param {object}  redBubble.redBubbleAlerts          - Alerts keyed by slug.
 * @param {boolean} redBubble.isRedBubbleAlertsLoading - Whether the alerts are loading.
 * @param {boolean} redBubble.isRedBubbleAlertsError   - Whether the alerts failed to load.
 */
export default function usePageView(
	currentTab,
	{ redBubbleAlerts, isRedBubbleAlertsLoading, isRedBubbleAlertsError }
) {
	const { recordEvent } = useAnalytics();
	const previousTabRef = useRef( null );

	const recordPageView = useCallback(
		previousTab => {
			recordEvent( 'jetpack_myjetpack_page_view', {
				...( ! isRedBubbleAlertsError && Object.keys( redBubbleAlerts )?.length
					? { red_bubble_alerts: Object.keys( redBubbleAlerts ).join( ',' ) }
					: {} ),
				tab_name: currentTab,
				previous_tab: previousTab,
			} );
		},
		[ recordEvent, redBubbleAlerts, isRedBubbleAlertsError, currentTab ]
	);

	// A layout effect runs before the screen's effects, so the page view is recorded first.
	useLayoutEffect( () => {
		if ( ! isRedBubbleAlertsLoading ) {
			recordPageView( previousTabRef.current );

			// Update previous tab for next navigation
			previousTabRef.current = currentTab;
		}
	}, [ recordPageView, isRedBubbleAlertsLoading, currentTab ] );

	// Recorded as a page load would: with no previous tab.
	useAdminShellReturn( useCallback( () => recordPageView( null ), [ recordPageView ] ) );
}
