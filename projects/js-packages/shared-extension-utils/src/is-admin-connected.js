import getJetpackData from './get-jetpack-data';

/**
 * Return whether the site has a connected admin user.
 *
 * @return {boolean} Whether the site has a connected admin.
 */
export default function isAdminConnected() {
	if (
		getJetpackData()?.jetpack?.has_connected_admin ||
		window?.JP_CONNECTION_INITIAL_STATE?.connectionStatus?.hasConnectedOwner ||
		window?.Jetpack_Editor_Initial_State?.connectionStatus?.hasConnectedAdmin
	) {
		return true;
	}
	return false;
}
