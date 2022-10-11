const sitePlanSelectors = {
	getSearchPlanInfo: state => state.sitePlan,
	hasBusinessPlan: state => state.sitePlan.supports_only_classic_search,
	getDisabledFromOverLimit: state => state.sitePlan.plan_usage.must_upgrade,
	supportsInstantSearch: state => state.sitePlan.supports_instant_search,
	supportsOnlyClassicSearch: state => state.sitePlan.supports_only_classic_search,
	getUpgradeBillPeriod: state => state.sitePlan?.default_upgrade_bill_period,
	supportsSearch: state =>
		state.sitePlan.supports_instant_search || state.sitePlan.supports_only_classic_search,
	getTierMaximumRecords: state => state.sitePlan.tier_maximum_records,
	getTierSlug: state => state.sitePlan.tier_slug,
	getLatestMonthRequests: state => state.sitePlan.plan_usage.num_requests_3m[ 0 ],
	getCurrentPlan: state => state.sitePlan.plan_current,
	getCurrentUsage: state => state.sitePlan.plan_usage,
};

export default sitePlanSelectors;
