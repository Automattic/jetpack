const CONNECTION_STATUS_REGISTERED = 'CONNECTION_STATUS_REGISTERED';
const CONNECTION_STATUS_USER_CONNECTED = 'CONNECTION_STATUS_USER_CONNECTED';

const connectionActions = {
	connectionStatusSetRegistered: isRegistered => {
		return { type: CONNECTION_STATUS_REGISTERED, isRegistered };
	},
	connectionStatusSetUserConnected: isUserConnected => {
		return { type: CONNECTION_STATUS_USER_CONNECTED, isUserConnected };
	},
};

export {
	CONNECTION_STATUS_REGISTERED,
	CONNECTION_STATUS_USER_CONNECTED,
	connectionActions as default,
};
