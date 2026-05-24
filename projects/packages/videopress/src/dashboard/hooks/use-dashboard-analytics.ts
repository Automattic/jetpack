import analytics from '@automattic/jetpack-analytics';
import { getScriptData } from '@automattic/jetpack-script-data';
import { useEffect } from '@wordpress/element';

// Page-view Tracks event, carried over from the legacy dashboard
// (`admin-page/index.tsx`).
const PAGE_VIEW_EVENT = 'jetpack_videopress_admin_page_view';

// window-scoped guard. The dashboard is a TanStack-routed SPA (`@wordpress/route`),
// so switching tabs remounts route stages client-side without a page reload —
// a per-mount effect would re-fire on every tab change. Keying the one-time
// init + page view off `window` (which only resets on a real page load) fires
// the page view once per load and never again on tab navigation, and shares
// the flag across the separately-bundled route chunks. Mirrors the
// window-singleton pattern used by the shared QueryClient.
const TRACKED_FLAG = '__jetpackVideoPressDashboardTracked' as const;

declare global {
	interface Window {
		[ TRACKED_FLAG ]?: boolean;
	}
}

/**
 * Identify the WPCOM user for Tracks and record the dashboard page-view event
 * once per page load, regardless of which tab the visitor lands on. User
 * identification is guarded for sites with no connected WPCOM user (e.g.
 * self-hosted, not yet connected). The event's `blog_id` is supplied
 * automatically by `window.jpTracksContext` (set alongside the connection
 * state in `class-initial-state.php`).
 */
export function useDashboardAnalytics(): void {
	useEffect( () => {
		if ( window[ TRACKED_FLAG ] ) {
			return;
		}
		window[ TRACKED_FLAG ] = true;

		const wpcomUser = getScriptData()?.user?.current_user?.wpcom;
		if ( wpcomUser?.ID && wpcomUser?.login ) {
			analytics.initialize( wpcomUser.ID, wpcomUser.login );
		}

		analytics.tracks.recordEvent( PAGE_VIEW_EVENT );
	}, [] );
}
