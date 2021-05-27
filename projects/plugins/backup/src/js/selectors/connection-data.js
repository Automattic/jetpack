const settingsSelectors = {
	getDoNotUseConnectionIframe: state => state.connectionData.doNotUseConnectionIframe || null,
	getAuthorizationUrl: state => state.connectionData.authorizationUrl || null,
};

export default settingsSelectors;
