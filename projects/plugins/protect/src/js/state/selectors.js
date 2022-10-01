const selectors = {
	getInstalledPlugins: state => state.installedPlugins || {},
	getInstalledThemes: state => state.installedThemes || {},
	getStatus: state => state.status || {},
	getStatusIsFetching: state => state.statusIsFetching || false,
	getWpVersion: state => state.wpVersion || '',
	getJetpackScan: state => state.jetpackScan || {},
	getProductData: state => state.productData || {},
};

export default selectors;
