const settingsSelectors = {
	getDoNotUseConnectionIframe: state => state.connectionData.doNotUseConnectionIframe || null,
};

export default settingsSelectors;
