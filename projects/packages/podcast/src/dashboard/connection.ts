// Connection helpers for the podcast dashboard. `podcast.is_connected` is the
// canonical server-side signal (Connection_Manager::is_connected()); the
// WPCOM-proxied surfaces gate on it rather than inferring connection from the
// blog ID (which is set at registration, before a token exists).

import { getMyJetpackUrl, getScriptData } from '@automattic/jetpack-script-data';

/**
 * Whether the site is connected to WordPress.com.
 *
 * @return {boolean} True when the site has a usable WP.com connection.
 */
export const isSiteConnected = (): boolean => getScriptData()?.podcast?.is_connected ?? false;

/**
 * URL of the My Jetpack connection screen, where a disconnected site links its
 * Jetpack account.
 *
 * @return {string} The connect URL.
 */
export const getConnectUrl = (): string => getMyJetpackUrl( '#/connection' );
