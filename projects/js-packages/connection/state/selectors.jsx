const getWpcomUser = state => {
	return state?.userConnectionData?.currentUser?.wpcomUser;
};

const getBlogId = state => {
	return state?.userConnectionData?.currentUser?.blogId;
};

const connectionSelectors = {
	getConnectionStatus: state => state.connectionStatus || {},
	/**
	 * Checks whether the store is fetching the connection status from the server
	 *
	 * @deprecated since 0.14.0
	 * @return {boolean} Is the store is fetching the connection status from the server?
	 */
	getConnectionStatusIsFetching: () => false,
	getSiteIsRegistering: state => state.siteIsRegistering || false,
	getUserIsConnecting: state => state.userIsConnecting || false,
	getRegistrationError: state => state.registrationError || false,
	getAuthorizationUrl: state => state.authorizationUrl || false,
	getUserConnectionData: state => state.userConnectionData || false,
	getConnectedPlugins: state => state.connectedPlugins || [],
	getConnectionOwner: state => state.connectionOwner || null,
	getConnectionErrors: state => state.connectionErrors || [],
	getConnectionHealthErrors: state => state.connectionHealthErrors || {},
	getIsOfflineMode: state => state.isOfflineMode || false,

	/*
	 * Protected owner. Each is `null` when the server withheld it from a viewer who cannot manage
	 * the connection, which is not the same as `false`: a caller that must tell "no" from "cannot
	 * say" compares against null rather than treating the value as a boolean.
	 */
	getHasProtectedOwner: state => state.hasProtectedOwner ?? null,
	getRequiresProtectedOwner: state => state.requiresProtectedOwner ?? null,
	getUseDefaultProtectedOwnerUi: state => state.useDefaultProtectedOwnerUi ?? null,

	getWpcomUser,
	getBlogId,
};

const selectors = {
	...connectionSelectors,
};

export default selectors;
