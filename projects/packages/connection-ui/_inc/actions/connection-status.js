const SET_CONNECTION_STATUS = 'SET_CONNECTION_STATUS';

const connectionStatusActions = {
	setConnectionStatus: connectionStatus => {
		return { type: SET_CONNECTION_STATUS, connectionStatus };
	},
};

export { SET_CONNECTION_STATUS, connectionStatusActions as default };
