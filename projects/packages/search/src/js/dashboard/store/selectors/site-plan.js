const sitePlanSelectors = {
	getSearchPlanInfo: state => state.sitePlan,
	hasBusinessPlan: state => state.sitePlan.supports_only_classic_search,
	hasActiveSearchPurchase: state => state.sitePlan.supports_instant_search,
	supportsInstantSearch: state => state.sitePlan.supports_instant_search,
	supportsOnlyClassicSearch: state => state.sitePlan.supports_only_classic_search,
	getUpgradeBillPeriod: state => state.sitePlan?.default_upgrade_bill_period,
	supportsSearch: state =>
		state.sitePlan.supports_instant_search || state.sitePlan.supports_only_classic_search,
};

export default sitePlanSelectors;
