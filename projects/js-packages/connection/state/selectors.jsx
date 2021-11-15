const connectionSelectors = {
	getConnectionStatus: state => state.connectionStatus || {},
	getConnectionStatusIsFetching: state => state.connectionStatusIsFetching || false,
	getSiteIsRegistering: state => state.siteIsRegistering || false,
	getUserIsConnecting: state => state.userIsConnecting || false,
};

const selectors = {
	...connectionSelectors,
};

export default selectors;
