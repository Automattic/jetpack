const getConnections = state => state.connectionData?.connections ?? {};

const connectionDataSelectors = {
	getConnections,
	getConnectionsAdminUrl: state => state.connectionData?.adminUrl ?? null,
	hasConnections: state => Object.keys( getConnections( state ) ).length > 0,
};

export default connectionDataSelectors;
