import { getSiteData } from '@automattic/jetpack-script-data';

export type JetpackBlogId = number;

/**
 * Look up the WP.com blog id from the global `JetpackScriptData` exposed by Jetpack's script-data
 * helper. Returns null when the data isn't on the page yet (defensive — the dashboard's PHP
 * `class-dashboard.php` always enqueues `jetpack-script-data`, so this should be present).
 *
 * @return WP.com blog id or null.
 */
export function getBlogId(): JetpackBlogId | null {
	const id = getSiteData()?.wpcom?.blog_id;
	return typeof id === 'number' && id > 0 ? id : null;
}
