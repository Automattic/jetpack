const siteRewindSelectors = {
	// Size
	isRewindSizeLoaded: state => state.siteRewindSize.loaded ?? null,
	isFetchingRewindSize: state => state.siteRewindSize.isFetching ?? null,
	getRewindSize: state => state.siteRewindSize.size ?? null,

	// Policies
	areRewindPoliciesLoaded: state => state.siteRewindPolicies.loaded ?? null,
	hasRewindStorageLimit: state => ( state.siteRewindPolicies.storageLimitBytes ? true : false ),
	isFetchingRewindPolicies: state => state.siteRewindPolicies.isFetching ?? null,
	getRewindStorageLimit: state => state.siteRewindPolicies.storageLimitBytes ?? null,
};

export default siteRewindSelectors;
