/**
 * Mock data for the Stats `summary` endpoint (`/proxy/v1.1/stats/summary`),
 * consumed by the Site overview widget. The response is a single flat object of
 * period totals; the comparison request returns the earlier period so tiles show
 * a period-over-period delta.
 */
export const mockStatsSummaryData = {
	date: '2026-06-22',
	period: 'day',
	views: 18240,
	visitors: 11680,
	likes: 842,
	reblogs: 37,
	comments: 296,
	followers: 5124,
};

export const mockStatsSummaryComparisonData = {
	date: '2026-05-22',
	period: 'day',
	views: 15980,
	visitors: 10420,
	likes: 910,
	reblogs: 41,
	comments: 268,
	followers: 4980,
};
