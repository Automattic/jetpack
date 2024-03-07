const ODYSSEY_STATS_API_NAMESPACE = 'jetpack/v4/stats-app';

export const getStatsHighlightsEndpoint = blogId =>
	`${ ODYSSEY_STATS_API_NAMESPACE }/sites/${ blogId }/stats/highlights`;
