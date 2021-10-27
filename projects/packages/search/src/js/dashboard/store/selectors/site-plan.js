const sitePlanSelectors = {
	getSearchPlanInfo: state => ( {
		supportsInstantSearch: state.sitePlan.supports_instant_search,
		supportsOnlyClassicSearch: state.sitePlan.supports_only_classic_search,
		supportsSearch: state.sitePlan.supports_search,
		searchSubscriptions: state.sitePlan.search_subscriptions,
	} ),
	hasBusinessPlan: state => state.sitePlan.supports_only_classic_search,
	hasActiveSearchPurchase: state => state.sitePlan.supports_instant_search,
	supportsInstantSearch: state => state.sitePlan.supports_instant_search,
	supportsOnlyClassicSearch: state => state.sitePlan.supports_only_classic_search,
};

export default sitePlanSelectors;
