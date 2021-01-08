const pluginSelectors = {
	getPlugins: state => state.plugins.all || [],
	isRequestInProgress: state => state.plugins.isRequestInProgress || false,
};

export default pluginSelectors;
