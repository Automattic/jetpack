import getJetpackData from './get-jetpack-data';

/**
 * Return whether the current user is connected to WP.com.
 *
 * @returns {boolean} Whether the current user is connected.
 */
export default function isCurrentUserConnected() {
	return getJetpackData()?.jetpack?.is_current_user_connected ?? false;
}
