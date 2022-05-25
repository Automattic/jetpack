const connectionDataSelectors = {
	getConnections: state => state.connectionData?.connections ?? [],
	getConnectionsAdminUrl: state => state.connectionData?.adminUrl ?? null,
};

export default connectionDataSelectors;
