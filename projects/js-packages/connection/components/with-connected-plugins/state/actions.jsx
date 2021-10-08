const SET_CONNECTED_PLUGINS = 'SET_CONNECTED_PLUGINS';
const SET_CONNECTED_PLUGINS_IS_FETCHING = 'SET_CONNECTED_PLUGINS_IS_FETCHING';

const connectedPluginsActions = {
	setConnectedPlugins: connectedPlugins => {
		return { type: SET_CONNECTED_PLUGINS, connectedPlugins };
	},
	setConnectedPluginsIsFetching: isFetching => {
		return { type: SET_CONNECTED_PLUGINS_IS_FETCHING, isFetching };
	},
};

export {
	SET_CONNECTED_PLUGINS,
	SET_CONNECTED_PLUGINS_IS_FETCHING,
	connectedPluginsActions as default,
};
