const selectors = {
	getCredentials: state => state.credentials || null,
	getCredentialsIsFetching: state => state.credentialsIsFetching || false,
	getInstalledPlugins: state => state.installedPlugins || {},
	getInstalledThemes: state => state.installedThemes || {},
	getStatus: state => state.status || {},
	getStatusIsFetching: state => state.statusIsFetching || false,
	getScanIsUnavailable: state => state.scanIsUnavailable || false,
	getScanIsEnqueuing: state => state.scanIsEnqueuing || false,
	getWpVersion: state => state.wpVersion || '',
	getJetpackScan: state => state.jetpackScan || {},
	getProductData: state => state.productData || {},
	getThreatsUpdating: state => state.threatsUpdating || {},
	getModalType: state => state.modal?.type || null,
	getModalProps: state => state.modal?.props || {},
	getNotice: state => state.notice || null,
	getThreatsAreFixing: state => state.threatsAreFixing || [],
	hasRequiredPlan: state => state.hasRequiredPlan || false,
};

export default selectors;
