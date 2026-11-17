import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { matchPath } from 'react-router';
import { MyJetpackRoutes } from '../../constants';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useAdminShellReturn from '../../hooks/use-admin-shell-return';
import useAnalytics from '../../hooks/use-analytics';
import { getLegacyHashHref } from '../../utils/route-href';
import { resolveMyJetpackSection } from '../my-jetpack-tab-panel/utils';

// Routes that show another screen: not `/features`, a section, nor `/add-license` while it has no screen.
const otherScreens = () =>
	Object.values( MyJetpackRoutes ).filter(
		route =>
			route !== MyJetpackRoutes.Home &&
			route !== MyJetpackRoutes.Features &&
			( route !== MyJetpackRoutes.AddLicense ||
				getMyJetpackWindowInitialState().loadAddLicenseScreen )
	);

/**
 * The tab a My Jetpack URL shows, as this screen resolves it.
 *
 * @param {string} url - The page URL.
 * @return {string|null} The tab, or null when the URL shows another screen.
 */
function tabOf( url ) {
	const { searchParams, hash } = new URL( url );
	const href = searchParams.get( 'p' ) || getLegacyHashHref( hash ) || '/';
	const { pathname } = new URL( href, 'http://route.invalid' );
	if ( otherScreens().some( route => matchPath( route, pathname ) ) ) {
		return null;
	}
	return resolveMyJetpackSection( matchPath( MyJetpackRoutes.Home, pathname )?.params.section );
}

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

	// Unset until hidden: a screen that mounts on a return has its mount count that view.
	const hiddenTabRef = useRef( undefined );
	useEffect( () => {
		const onHidden = event => {
			if ( event.detail?.page === 'my-jetpack' ) {
				hiddenTabRef.current = currentTab;
			}
		};
		window.addEventListener( 'jetpack-admin-shell:page-hidden', onHidden );
		return () => window.removeEventListener( 'jetpack-admin-shell:page-hidden', onHidden );
	}, [ currentTab ] );

	// Recorded as a page load would: with no previous tab. While loading, or on a return to another
	// tab, the effect above records it; it records nothing for another URL of the same tab.
	useAdminShellReturn(
		useCallback(
			( { routeChanged, url } ) => {
				if (
					! isRedBubbleAlertsLoading &&
					( ! routeChanged || tabOf( url ) === hiddenTabRef.current )
				) {
					recordPageView( null );
				}
			},
			[ recordPageView, isRedBubbleAlertsLoading ]
		)
	);
}
