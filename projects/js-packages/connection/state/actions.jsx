const SET_CONNECTION_STATUS = 'SET_CONNECTION_STATUS';
const SET_CONNECTION_STATUS_IS_FETCHING = 'SET_CONNECTION_STATUS_IS_FETCHING';
const FETCH_CONNECTION_STATUS = 'FETCH_CONNECTION_STATUS';
const SET_SITE_IS_REGISTERING = 'SET_SITE_IS_REGISTERING';
const SET_USER_IS_CONNECTING = 'SET_USER_IS_CONNECTING';

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
	setSiteIsRegistering: isRegistering => {
		return { type: SET_SITE_IS_REGISTERING, isRegistering };
	},
	setUserIsConnecting: isConnecting => {
		return { type: SET_USER_IS_CONNECTING, isConnecting };
	},
};

const actions = {
	...connectionStatusActions,
};

export {
	SET_CONNECTION_STATUS,
	SET_CONNECTION_STATUS_IS_FETCHING,
	FETCH_CONNECTION_STATUS,
	SET_SITE_IS_REGISTERING,
	SET_USER_IS_CONNECTING,
	actions as default,
};
