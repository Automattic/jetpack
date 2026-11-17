import analytics from '@automattic/jetpack-analytics';
import { useEffect, useRef } from '@wordpress/element';
import type { SocialTab } from '../../components/social-page';

/**
 * Record `jetpack_social_tab_view` on mount, whenever the active tab changes, and when the admin
 * shell shows the page again.
 *
 * @param activeTab - The tab on screen.
 */
export default function useTabView( activeTab: SocialTab ): void {
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
	useEffect( () => {
		const onShown = ( event: Event ) => {
			const { page, firstShow } = ( event as CustomEvent ).detail ?? {};
			if ( page === 'jetpack-social' && ! firstShow ) {
				analytics.tracks.recordEvent( 'jetpack_social_tab_view', { tab: activeTab } );
			}
		};
		window.addEventListener( 'jetpack-admin-shell:page-shown', onShown );
		return () => window.removeEventListener( 'jetpack-admin-shell:page-shown', onShown );
	}, [ activeTab ] );
}
