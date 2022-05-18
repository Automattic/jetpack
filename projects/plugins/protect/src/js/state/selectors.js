const selectors = {
	getInstalledPlugins: state => state.installedPlugins || {},
	getInstalledThemes: state => state.installedThemes || {},
	getStatus: state => state.status || {},
	getStatusIsFetching: state => state.statusIsFetching || false,
	getWpVersion: state => state.wpVersion || '',
	getSecurityBundle: state => state.securityBundle || {},
	getProductData: state => state.productData || {},
};

export default selectors;
