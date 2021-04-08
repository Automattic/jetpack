const connectionSelectors = {
	getConnectionStatus: state => state.connectionStatus || {},
	getAuthorizationUrl: state => state.authorizationUrl || null,
	getDoNotUseConnectionIframe: state => state.doNotUseConnectionIframe || null,
};

export default connectionSelectors;
