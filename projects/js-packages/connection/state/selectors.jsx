const connectionSelectors = {
	getConnectionStatus: state => state.connectionStatus || {},
	getConnectionStatusIsFetching: state => state.connectionStatusIsFetching || false,
};

const selectors = {
	...connectionSelectors,
};

export default selectors;
