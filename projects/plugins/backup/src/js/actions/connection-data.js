const CONNECTION_DATA_SET_AUTHORIZATION_URL = 'CONNECTION_DATA_AUTHORIZATION_URL_SET';

const connectionDataActions = {
	connectionDataSetAuthorizationUrl: url => {
		return { type: CONNECTION_DATA_SET_AUTHORIZATION_URL, url };
	},
};

export { CONNECTION_DATA_SET_AUTHORIZATION_URL, connectionDataActions as default };
