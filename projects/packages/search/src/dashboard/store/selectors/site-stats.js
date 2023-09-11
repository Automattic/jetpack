const siteStatsSelectors = {
	getSearchStats: state => state.siteStats,
	getPostCount: state => state.siteStats?.post_count,
	getPostTypeBreakdown: state => state.siteStats?.post_type_breakdown,
	getLastIndexedDate: state => state.siteStats?.last_indexed_date,
};

export default siteStatsSelectors;
