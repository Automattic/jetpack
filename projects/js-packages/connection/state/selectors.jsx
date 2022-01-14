const connectionSelectors = {
	getConnectionStatus: state => state.connectionStatus || {},
	getSiteIsRegistering: state => state.siteIsRegistering || false,
	getUserIsConnecting: state => state.userIsConnecting || false,
	getRegistrationError: state => state.registrationError || false,
	getAuthorizationUrl: state => state.authorizationUrl || false,
	getUserConnectionData: state => state.userConnectionData || false,
};

const selectors = {
	...connectionSelectors,
};

export default selectors;
