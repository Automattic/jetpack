const SET_CONNECTION_STATUS = 'SET_CONNECTION_STATUS';
const SET_CONNECTION_STATUS_IS_FETCHING = 'SET_CONNECTION_STATUS_IS_FETCHING';
const FETCH_CONNECTION_STATUS = 'FETCH_CONNECTION_STATUS';

const connectionStatusActions = {
	setConnectionStatus: connectionStatus => {
		return { type: SET_CONNECTION_STATUS, connectionStatus };
	},
	setConnectionStatusIsFetching: isFetching => {
		return { type: SET_CONNECTION_STATUS_IS_FETCHING, isFetching };
	},
	fetchConnectionStatus: () => {
		return { type: FETCH_CONNECTION_STATUS };
	},
};

const actions = {
	...connectionStatusActions,
};

export {
	SET_CONNECTION_STATUS,
	SET_CONNECTION_STATUS_IS_FETCHING,
	FETCH_CONNECTION_STATUS,
	actions as default,
};
