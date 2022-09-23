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
};

const selectors = {
	...connectionSelectors,
};

export default selectors;
