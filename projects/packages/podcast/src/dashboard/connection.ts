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
