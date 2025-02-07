import getJetpackData from './get-jetpack-data';

/**
 * Return whether the current user is connected to WP.com.
 *
 * @return {boolean} Whether the current user is connected.
 */
export default function isCurrentUserConnected() {
	if (
		getJetpackData()?.jetpack?.is_current_user_connected ||
		window?.JP_CONNECTION_INITIAL_STATE?.connectionStatus?.isUserConnected
	) {
		return true;
	}

	return false;
}
