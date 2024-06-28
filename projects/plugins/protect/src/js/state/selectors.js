const selectors = {
	getCredentials: state => state.credentials || null,
	getCredentialsIsFetching: state => state.credentialsIsFetching || false,
	getInstalledPlugins: state => state.installedPlugins || {},
	getInstalledThemes: state => state.installedThemes || {},
	getViewingScanHistory: state => state.viewingScanHistory || false,
	getScanHistory: state => state.scanHistory || {},
	getStatus: state => state.status || {},
	getStatusIsFetching: state => state.statusIsFetching || false,
	getScanIsUnavailable: state => state.scanIsUnavailable || false,
	getScanIsEnqueuing: state => state.scanIsEnqueuing || false,
	getWpVersion: state => state.wpVersion || '',
	getJetpackScan: state => state.jetpackScan || {},
	getThreatsUpdating: state => state.threatsUpdating || {},
	getModalType: state => state.modal?.type || null,
	getModalProps: state => state.modal?.props || {},
	getNotice: state => state.notice || null,
	getThreatsAreFixing: state => state.threatsAreFixing || [],
	hasRequiredPlan: state => state.hasRequiredPlan || false,
	getOnboardingProgress: state => state.onboardingProgress || null,
	getWaf: state => state.waf,
};

export default selectors;
