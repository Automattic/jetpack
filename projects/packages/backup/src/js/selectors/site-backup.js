const siteBackupSelectors = {
	// Size
	isFetchingBackupSize: state => state.siteBackupSize.isFetching ?? null,
	getBackupSize: state => state.siteBackupSize.size ?? null,
	getMinDaysOfBackupsAllowed: state => state.siteBackupSize.minDaysOfBackupsAllowed ?? null,
	getDaysOfBackupsAllowed: state => state.siteBackupSize.daysOfBackupsAllowed ?? null,
	getDaysOfBackupsSaved: state => state.siteBackupSize.daysOfBackupsSaved ?? null,

	// Policies
	isFetchingBackupPolicies: state => state.siteBackupPolicies.isFetching ?? null,
	getBackupStorageLimit: state => state.siteBackupPolicies.storageLimitBytes ?? null,
	getActivityLogLimitDays: state => state.siteBackupPolicies.activityLogLimitDays ?? null,

	// Storage
	getStorageUsageLevel: state => state.siteBackupStorage.usageLevel ?? null,
	getStorageAddonOfferSlug: state => state.siteBackupStorage.addonOfferSlug ?? null,
};

export default siteBackupSelectors;
