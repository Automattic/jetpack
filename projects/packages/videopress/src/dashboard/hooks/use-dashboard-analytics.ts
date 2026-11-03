import analytics from '@automattic/jetpack-analytics';
import { getScriptData } from '@automattic/jetpack-script-data';
import { useEffect } from '@wordpress/element';

// Page-view Tracks event, carried over from the legacy dashboard
// (`admin-page/index.tsx`).
const PAGE_VIEW_EVENT = 'jetpack_videopress_admin_page_view';

export type DashboardRoute = 'overview' | 'library' | 'settings' | 'video' | 'video_editor';

// Share the once-per-load guard across separately bundled SPA route stages.
const TRACKED_FLAG = '__jetpackVideoPressDashboardTracked' as const;

declare global {
	interface Window {
		[ TRACKED_FLAG ]?: boolean;
	}
}

/**
 * Record the landing route once per page load using the existing Tracks identity.
 * Site identity is supplied by the shared `window.jpTracksContext`.
 *
 * @param route - Bounded route name; never a URL or attachment identifier.
 */
export function useDashboardAnalytics( route: DashboardRoute ): void {
	useEffect( () => {
		if ( window[ TRACKED_FLAG ] ) {
			return;
		}
		window[ TRACKED_FLAG ] = true;

		const wpcomUser = getScriptData()?.user?.current_user?.wpcom;
		if ( wpcomUser?.ID && wpcomUser?.login ) {
			analytics.initialize( wpcomUser.ID, wpcomUser.login );
		}

		const access =
			typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined'
				? JPVIDEOPRESS_INITIAL_STATE?.siteData?.hasVideoPressAccess
				: undefined;

		analytics.tracks.recordEvent( PAGE_VIEW_EVENT, {
			route,
			// Missing access data must not be counted as a free plan.
			...( typeof access === 'boolean' ? { is_free: ! access } : {} ),
		} );
	}, [ route ] );
}
