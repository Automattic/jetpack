import jetpackAnalytics from '@automattic/jetpack-analytics';
import { getScriptData, getSiteData } from '@automattic/jetpack-script-data';

let initialized = false;

/**
 * Identify the current user and pin `blog_id` onto every Tracks event.
 *
 * On Simple, wpcom's stats.php pushes `identifyUser` and `storeContext` before
 * our bundle runs, so this is a no-op there and the guards below all fall
 * through. Atomic and self-hosted have no equivalent, so without this their
 * events would land anonymous and blog-less once the transport is loaded.
 *
 * Idempotent — safe to call from a StrictMode double-invoked effect.
 */
export function initializeAnalytics(): void {
	if ( initialized ) {
		return;
	}
	initialized = true;

	const blogId = getSiteData()?.wpcom?.blog_id;
	const superProps = blogId ? { blog_id: blogId } : undefined;
	const user = getScriptData()?.podcast?.tracks_user_data;

	// `initialize()` calls `setSuperProps`, which *replaces* rather than merges —
	// so super props have to go through it, not a prior `assignSuperProps` call.
	if ( user ) {
		jetpackAnalytics.initialize( user.userid, user.username, superProps );
	} else if ( superProps ) {
		jetpackAnalytics.assignSuperProps( superProps );
	}
}
