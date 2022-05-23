const connectionsSelectors = {
	getConnections: state => state.connections ?? [],
	getConnectionsAdminUrl: state => state.connectionsAdminUrl ?? null,
};

export default connectionsSelectors;
