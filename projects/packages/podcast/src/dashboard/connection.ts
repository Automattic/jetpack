// Connection helpers for the podcast dashboard. The WP.com blog ID is only
// present once the site is connected to WordPress.com (0 when installed but not
// connected), and it's the same signal the stats/distribution proxies gate on
// server-side — so the dashboard treats it as the connection check.

import { getMyJetpackUrl, getSiteData } from '@automattic/jetpack-script-data';

/**
 * Whether the site is connected to WordPress.com.
 *
 * @return {boolean} True once a WP.com blog ID is present.
 */
export const isSiteConnected = (): boolean => Number( getSiteData()?.wpcom?.blog_id ?? 0 ) > 0;

/**
 * URL of the My Jetpack connection screen, where a disconnected site links its
 * Jetpack account.
 *
 * @return {string} The connect URL.
 */
export const getConnectUrl = (): string => getMyJetpackUrl( '#/connection' );
