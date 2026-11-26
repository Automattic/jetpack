import analytics from '@automattic/jetpack-analytics';
import { useEffect, useRef } from '@wordpress/element';
import type { SocialTab } from '../../components/social-page';

/**
 * The `?tab=` value in a page URL; the router keeps its route in the `p` query arg.
 *
 * @param url - The page URL.
 * @return The value, or null.
 */
function tabParamOf( url: string ): string | null {
	const route = new URL( url ).searchParams.get( 'p' ) ?? '/';
	return new URL( route, 'https://route.invalid' ).searchParams.get( 'tab' );
}

/**
 * Record `jetpack_social_tab_view` on mount, whenever the active tab changes, and when the admin
 * shell shows the page again.
 *
 * @param activeTab  - The tab on screen.
 * @param resolveTab - Resolves a `?tab=` value to the tab it shows.
 */
export default function useTabView(
	activeTab: SocialTab,
	resolveTab: ( tab: unknown ) => SocialTab
): void {
	// A ref outlives StrictMode's dev-only remount, so the remount records nothing.
	const lastTrackedTab = useRef< SocialTab | null >( null );
	useEffect( () => {
		if ( lastTrackedTab.current === activeTab ) {
			return;
		}
		lastTrackedTab.current = activeTab;
		analytics.tracks.recordEvent( 'jetpack_social_tab_view', { tab: activeTab } );
	}, [ activeTab ] );

	// The admin shell keeps this page mounted, so a return to it is a new visit: see the admin-ui README.
	const hiddenTab = useRef( activeTab );
	useEffect( () => {
		const onHidden = ( event: Event ) => {
			if ( ( event as CustomEvent ).detail?.page === 'jetpack-social' ) {
				hiddenTab.current = activeTab;
			}
		};
		const onShown = ( event: Event ) => {
			const { page, firstShow, routeChanged, url } = ( event as CustomEvent ).detail ?? {};
			if ( page !== 'jetpack-social' || firstShow ) {
				return;
			}
			// The effect above records a return to another tab, but not to another URL of the same tab.
			if ( ! routeChanged || resolveTab( tabParamOf( url ) ) === hiddenTab.current ) {
				analytics.tracks.recordEvent( 'jetpack_social_tab_view', { tab: activeTab } );
			}
		};
		window.addEventListener( 'jetpack-admin-shell:page-hidden', onHidden );
		window.addEventListener( 'jetpack-admin-shell:page-shown', onShown );
		return () => {
			window.removeEventListener( 'jetpack-admin-shell:page-hidden', onHidden );
			window.removeEventListener( 'jetpack-admin-shell:page-shown', onShown );
		};
	}, [ activeTab, resolveTab ] );
}
