const siteBackupSelectors = {
	// Size
	isFetchingBackupSize: state => state.siteBackupSize.isFetching ?? null,
	getBackupSize: state => state.siteBackupSize.size ?? null,

	// Policies
	isFetchingBackupPolicies: state => state.siteBackupPolicies.isFetching ?? null,
	getBackupStorageLimit: state => state.siteBackupPolicies.storageLimitBytes ?? null,
};

export default siteBackupSelectors;
