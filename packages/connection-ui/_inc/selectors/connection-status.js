const connectionStatusSelectors = {
	getConnectionStatus: state => {
		return state.connectionStatus || {};
	},
};

export default connectionStatusSelectors;
