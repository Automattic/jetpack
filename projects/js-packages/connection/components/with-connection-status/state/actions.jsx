const SET_CONNECTION_STATUS = 'SET_CONNECTION_STATUS';
const SET_CONNECTION_STATUS_IS_FETCHING = 'SET_CONNECTION_STATUS_IS_FETCHING';

const connectionStatusActions = {
	setConnectionStatus: connectionStatus => {
		return { type: SET_CONNECTION_STATUS, connectionStatus };
	},
	setConnectionStatusIsFetching: isFetching => {
		return { type: SET_CONNECTION_STATUS_IS_FETCHING, isFetching };
	},
};

export {
	SET_CONNECTION_STATUS,
	SET_CONNECTION_STATUS_IS_FETCHING,
	connectionStatusActions as default,
};
