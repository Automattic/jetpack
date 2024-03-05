const REST_API_NAMESPACE = 'my-jetpack/v1';
const ODYSSEY_STATS_API_NAMESPACE = 'jetpack/v4/stats-app';

export const REST_API_SITE_DISMISS_BANNER = `${ REST_API_NAMESPACE }/site/dismiss-welcome-banner`;

export const getStatsHighlightsEndpoint = blogId =>
	`${ ODYSSEY_STATS_API_NAMESPACE }/sites/${ blogId }/stats/highlights`;
