const connectedPluginsSelectors = {
	getConnectedPlugins: state => { console.log( state ); return state.connectedPlugins || [] },
};

export default connectedPluginsSelectors;
