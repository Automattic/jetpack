const siteBackupSelectors = {
	// Size
	isFetchingBackupSize: state => state.siteBackupSize.isFetching ?? null,
	getBackupSize: state => state.siteBackupSize.size ?? null,
	getLastBackupSize: state => state.siteBackupSize.lastBackupSize ?? null,
	getMinDaysOfBackupsAllowed: state => state.siteBackupSize.minDaysOfBackupsAllowed ?? null,
	getDaysOfBackupsAllowed: state => state.siteBackupSize.daysOfBackupsAllowed ?? null,
	getDaysOfBackupsSaved: state => state.siteBackupSize.daysOfBackupsSaved ?? null,
	getBackupRetentionDays: state => state.siteBackupSize.retentionDays ?? null,
	hasBackupSizeLoaded: state => state.siteBackupSize.loaded,
	getBackupStoppedFlag: state => state.siteBackupSize.backupsStopped ?? null,

	// Policies
	isFetchingBackupPolicies: state => state.siteBackupPolicies.isFetching ?? null,
	getBackupStorageLimit: state => state.siteBackupPolicies.storageLimitBytes ?? null,
	getActivityLogLimitDays: state => state.siteBackupPolicies.activityLogLimitDays ?? null,
	hasBackupPoliciesLoaded: state => state.siteBackupPolicies.loaded,

	// Storage
	getStorageUsageLevel: state => state.siteBackupStorage.usageLevel ?? null,
	getStorageAddonOfferSlug: state => state.siteBackupStorage.addonOfferSlug ?? null,

	// Backups
	getBackups: state => state.siteBackups.backups ?? [],
	hasLoadedBackups: state => state.siteBackups.loaded,
	isFetchingBackups: state => state.siteBackups.isFetching,
	// Whether the last read failed. `getBackups` floors a missing list to
	// `[]`, so without this a failed read is indistinguishable from a site
	// that genuinely has no backups yet.
	hasBackupsFetchFailed: state => state.siteBackups.fetchFailed ?? false,
};

export default siteBackupSelectors;
