const siteStatsSelectors = {
	getSearchStats: state => state.siteStats,
	getPostCount: state => state.siteStats?.post_count,
	getPostTypeBreakdown: state => state.siteStats?.post_type_breakdown,
};

export default siteStatsSelectors;
