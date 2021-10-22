const sitePlanSelectors = {
	hasBusinessPlan: state => false, //state.sitePlan.hasBusinessPlan,
	hasActiveSearchPurchase: state => true, //state.sitePlan.hasActiveSearchPurchase,
	supportsInstantSearch: state => state.sitePlan.supportsInstantSearch,
	supportsOnlyClassicSearch: state => state.sitePlan.supportsOnlyClassicSearch,
};

export default sitePlanSelectors;
