const getWpcomUser = state => {
	return state?.userConnectionData.currentUser?.wpcomUser;
};

const getBlogId = state => {
	return state?.userConnectionData.currentUser?.blogId;
};

const connectionSelectors = {
	getConnectionStatus: state => state.connectionStatus || {},
	/**
	 * Checks whether the store is fetching the connection status from the server
	 *
	 * @deprecated since 0.14.0
	 * @returns {boolean} Is the store is fetching the connection status from the server?
	 */
	getConnectionStatusIsFetching: () => false,
	getSiteIsRegistering: state => state.siteIsRegistering || false,
	getUserIsConnecting: state => state.userIsConnecting || false,
	getRegistrationError: state => state.registrationError || false,
	getAuthorizationUrl: state => state.authorizationUrl || false,
	getUserConnectionData: state => state.userConnectionData || false,
	getConnectedPlugins: state => state.connectedPlugins || [],
	getConnectionErrors: state => state.connectionErrors || [],

	getWpcomUser,
	getBlogId,
};

const selectors = {
	...connectionSelectors,
};

export default selectors;
