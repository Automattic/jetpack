import jetpackAnalytics from '@automattic/jetpack-analytics';
import { getScriptData, getSiteData } from '@automattic/jetpack-script-data';

let initialized = false;
let viewRecorded = false;

/**
 * Identify the current user and pin `blog_id` onto every Tracks event.
 *
 * On Simple, wpcom's stats.php pushes `identifyUser` and `storeContext` before
 * our bundle runs, so `tracks_user_data` is null there and only the redundant
 * `blog_id` super prop gets set. Atomic and self-hosted have no equivalent, so
 * without this their events would land anonymous and blog-less once the
 * transport is loaded.
 *
 * Idempotent — safe to call from a StrictMode double-invoked effect.
 */
export function initializeAnalytics(): void {
	if ( initialized ) {
		return;
	}
	initialized = true;

	const user = getScriptData()?.podcast?.tracks_user_data;
	if ( user ) {
		jetpackAnalytics.initialize( user.userid, user.username );
	}

	// After `initialize()`, which calls `setSuperProps` — that *replaces* rather
	// than merges, so assigning first would wipe the blog_id straight back out.
	const blogId = getSiteData()?.wpcom?.blog_id;
	if ( blogId ) {
		jetpackAnalytics.assignSuperProps( { blog_id: blogId } );
	}
}

interface DashboardView {
	view: string;
	is_set_up: boolean;
	settings_missing: number;
	has_product_access: boolean;
	is_connected: boolean;
}

/**
 * Record `jetpack_podcast_dashboard_viewed` once per page load — the
 * denominator every other dashboard event is missing.
 *
 * No episode count: the probe behind it is a REST request, and
 * `wpcom_podcast_episode_published` already answers it server-side.
 *
 * @param props - View properties.
 */
export function recordDashboardView( props: DashboardView ): void {
	if ( viewRecorded ) {
		return;
	}
	viewRecorded = true;

	initializeAnalytics();
	jetpackAnalytics.tracks.recordEvent( 'jetpack_podcast_dashboard_viewed', props );
}
