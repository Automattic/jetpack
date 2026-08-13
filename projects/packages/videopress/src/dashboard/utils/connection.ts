import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * Whether this site is connected to WordPress.com.
 *
 * The tus upload pipeline needs a WordPress.com upload JWT, so upload paths
 * branch on this: connected sites get the real VideoPress uploader, and only
 * disconnected ones (local Docker, unconnected installs) fall back to plain
 * `wp/v2/media`.
 *
 * @return True when the site has a positive WordPress.com blog id.
 */
export function isWpcomConnected(): boolean {
	const blogId = getScriptData()?.site?.wpcom?.blog_id;
	return typeof blogId === 'number' && blogId > 0;
}
