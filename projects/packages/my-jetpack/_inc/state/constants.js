const REST_API_NAMESPACE = 'my-jetpack/v1';
const ODYSSEY_STATS_API_NAMESPACE = 'jetpack/v4/stats-app';

export const REST_API_SITE_DISMISS_BANNER = `${ REST_API_NAMESPACE }/site/dismiss-welcome-banner`;
export const REST_API_SITE_PRODUCTS_ENDPOINT = `${ REST_API_NAMESPACE }/site/products`;
export const REST_API_REWINDABLE_BACKUP_EVENTS_ENDPOINT = `${ REST_API_NAMESPACE }/site/backup/undo-event`;
export const REST_API_COUNT_BACKUP_ITEMS_ENDPOINT = `${ REST_API_NAMESPACE }/site/backup/count-items`;
export const REST_API_CHAT_AVAILABILITY_ENDPOINT = `${ REST_API_NAMESPACE }/chat/availability`;
export const REST_API_CHAT_AUTHENTICATION_ENDPOINT = `${ REST_API_NAMESPACE }/chat/authentication`;
export const PRODUCTS_THAT_NEEDS_INITIAL_FETCH = [ 'scan' ];

export const PRODUCT_ID_VIDEOPRESS = 'videopress';
export const REST_API_VIDEOPRESS_FEATURED_STATS = 'videopress/v1/stats/featured';

export const getStatsHighlightsEndpoint = blogId =>
	`${ ODYSSEY_STATS_API_NAMESPACE }/sites/${ blogId }/stats/highlights`;
