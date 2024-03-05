const getStatsCounts = state => {
	return state.statsCounts?.data;
};

const getLifecycleStats = state => {
	return state.lifecycleStats;
};

const noticeSelectors = {
	getGlobalNotice: state => state.notices?.global,
};

const getGuessedSiteLifecycleStatus = state => {
	const { modules, purchases, plugins, isSiteConnected, isUserConnected } =
		getLifecycleStats( state );

	// 'new' = no purchases + less than 3 modules
	if ( purchases.length === 0 && modules.length < 3 ) {
		// 'brand-new' = 'new' + (no user or site connection + no modules + only one plugin)
		if (
			( ! isUserConnected || ! isSiteConnected ) &&
			modules.length === 0 &&
			plugins.length === 1
		) {
			return 'brand-new';
		}

		return 'new';
	}

	// 'settling-in' = 1 purchase and less than 10 modules
	if ( purchases.length === 1 && modules.length < 10 ) {
		return 'settling-in';
	}

	// 'established' = 2 or more purchases or 10 or more modules
	return 'established';
};

const isFetchingStatsCounts = state => {
	return state.statsCounts?.isFetching || false;
};

const statsCountsSelectors = {
	getStatsCounts,
	isFetchingStatsCounts,
};

const getWelcomeBannerHasBeenDismissed = state => {
	return state.welcomeBanner?.hasBeenDismissed;
};

const selectors = {
	...statsCountsSelectors,
	...noticeSelectors,
	getWelcomeBannerHasBeenDismissed,
	getGuessedSiteLifecycleStatus,
};

export default selectors;
