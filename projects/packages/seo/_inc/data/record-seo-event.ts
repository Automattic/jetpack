import jetpackAnalytics from '@automattic/jetpack-analytics';
import { getScriptData } from '@automattic/jetpack-script-data';
import type { SeoTab } from '../dashboard/dashboard-nav';

/** The dashboard screen an event was fired from. */
export type SeoTracksScreen = 'overview' | 'settings' | 'content' | 'geo';

/**
 * The reporting name for a dashboard tab: the GEO tab is keyed `ai` internally.
 *
 * @param tab - The internal tab id.
 * @return The screen name to report.
 */
export function screenForTab( tab: SeoTab ): SeoTracksScreen {
	return tab === 'ai' ? 'geo' : tab;
}

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

type SeoScriptData = { seo?: { tracks?: SeoTracksContext } };

/** Values Tracks accepts as properties. Use the string `none` for N/A — never null/undefined. */
type EventProps = Record< string, string | number | boolean >;

/**
 * Fire a Tracks event with the standard SEO props, including the `blog_id` join key.
 *
 * Still fires without the server context: a partial event beats a silent gap.
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
	const context = ( getScriptData() as SeoScriptData | undefined )?.seo?.tracks;

	jetpackAnalytics.tracks.recordEvent( event, {
		surface: 'wp_admin',
		screen,
		...context,
		...props,
	} );
}
