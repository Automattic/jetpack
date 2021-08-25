const connectionSelectors = {
	getConnectionStatus: state => state.connectionStatus || {},
	getConnectionStatusIsFetching: state => state.connectionStatusIsFetching || false,
};

export default connectionSelectors;
