// Raw `stats/insights` response (pre-sanitizer): a clear peak day and hour so
// the Most popular time widget renders both populated highlights. The endpoint
// reports across the whole site lifetime and has no comparison period.
export const mockStatsInsightsData = {
	highest_hour: 18,
	highest_hour_percent: 30,
	highest_day_of_week: 4,
	highest_day_percent: 22,
	hourly_views: {},
	years: [],
};
