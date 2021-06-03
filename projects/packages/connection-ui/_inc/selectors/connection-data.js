const settingsSelectors = {
	getDoNotUseConnectionIframe: state => state.connectionData.doNotConnectInPlace || null,
};

export default settingsSelectors;
