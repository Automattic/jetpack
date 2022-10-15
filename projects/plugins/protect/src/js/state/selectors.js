const selectors = {
	getCredentialState: state => state.credentialState || {},
	getInstalledPlugins: state => state.installedPlugins || {},
	getInstalledThemes: state => state.installedThemes || {},
	getStatus: state => state.status || {},
	getStatusIsFetching: state => state.statusIsFetching || false,
	getScanIsEnqueuing: state => state.scanIsEnqueuing || false,
	getWpVersion: state => state.wpVersion || '',
	getJetpackScan: state => state.jetpackScan || {},
	getProductData: state => state.productData || {},
	getThreatsUpdating: state => state.threatsUpdating || {},
	getModalType: state => state.modal?.type || null,
	getModalProps: state => state.modal?.props || {},
	getNotice: state => state.notice || null,
};

export default selectors;
