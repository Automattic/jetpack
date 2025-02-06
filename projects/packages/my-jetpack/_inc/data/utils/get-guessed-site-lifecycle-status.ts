const getGuessedSiteLifecycleStatus = (
	lifecycleStats: Window[ 'myJetpackInitialState' ][ 'lifecycleStats' ]
) => {
	if ( ! lifecycleStats ) {
		return 'unknown';
	}

	const {
		modules,
		purchases,
		jetpackPlugins: plugins,
		isSiteConnected,
		isUserConnected,
	} = lifecycleStats;

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

export default getGuessedSiteLifecycleStatus;
