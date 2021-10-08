const connectedPluginsSelectors = {
	getConnectedPlugins: state =>
		state.connectedPlugins ? Object.values( state.connectedPlugins ) : [],
	getConnectedPluginsIsFetching: state => state.connectedPluginsIsFetching || false,
};

export default connectedPluginsSelectors;
