import jetpackAnalytics from '@automattic/jetpack-analytics';
import { getScriptData } from '@automattic/jetpack-script-data';
import type { SeoTab } from '../dashboard/dashboard-nav';

/**
 * The dashboard screen an event was fired from. It is the tab id, so renaming a
 * tab changes the `screen` value Tracks reports.
 */
export type SeoTracksScreen = SeoTab;

/**
 * Server-provided identifiers attached to every SEO event
 * (see `Admin_Page::get_tracks_context()`).
 */
interface SeoTracksContext {
	blog_id: number;
	site_type: 'simple' | 'atomic' | 'jetpack';
	is_a11n: boolean;
	is_test: boolean;
	product_version: string;
}

type SeoScriptData = {
	seo?: { tracks?: SeoTracksContext };
	connection?: {
		userConnectionData?: { currentUser?: { wpcomUser?: { ID?: number; login?: string } } };
	};
};

// Each route is a separate bundle with its own copy of this module, so once-per-page guards live on `window`.
type SeoWindow = Window & { jetpackSeoScreenViewed?: boolean; jetpackSeoUserIdentified?: boolean };

/** Values Tracks accepts as properties. Use the string `none` for N/A — never null/undefined. */
type EventProps = Record< string, string | number | boolean >;

/**
 * Fire a Tracks event with the standard SEO props, including the `blog_id` join key.
 *
 * The server omits the context when the site hasn't opted into tracking, and then nothing is recorded.
 *
 * @param event  - The full event name, e.g. `jetpack_seo_setting_updated`.
 * @param screen - The dashboard screen the event came from.
 * @param props  - Event-specific properties. Use `none` (not null) for N/A values.
 */
export function recordSeoEvent(
	event: string,
	screen: SeoTracksScreen,
	props: EventProps = {}
): void {
	try {
		const data = getScriptData() as SeoScriptData | undefined;
		const context = data?.seo?.tracks;
		if ( ! context ) {
			return;
		}

		// Simple identifies the user in stats.php; elsewhere only the connected account can.
		const page = window as SeoWindow;
		const user = data?.connection?.userConnectionData?.currentUser?.wpcomUser;
		if ( ! page.jetpackSeoUserIdentified && user?.ID && user.login ) {
			jetpackAnalytics.initialize( user.ID, user.login );
			page.jetpackSeoUserIdentified = true;
		}

		jetpackAnalytics.tracks.recordEvent( event, {
			surface: 'wp_admin',
			screen,
			...context,
			...props,
		} );
	} catch {
		// Callers record from their save paths: a broken transport must not fail the save.
	}
}

/**
 * Fire `jetpack_seo_screen_viewed` once per page load.
 *
 * @param screen - The landing screen.
 */
export function recordScreenViewOnce( screen: SeoTracksScreen ): void {
	const page = window as SeoWindow;
	if ( page.jetpackSeoScreenViewed ) {
		return;
	}
	page.jetpackSeoScreenViewed = true;
	recordSeoEvent( 'jetpack_seo_screen_viewed', screen );
}
