// API
const REST_API_NAMESPACE = 'my-jetpack/v1';
const ODYSSEY_STATS_API_NAMESPACE = 'jetpack/v4/stats-app';

export const REST_API_SITE_PURCHASES_ENDPOINT = `${ REST_API_NAMESPACE }/site/purchases`;
export const REST_API_REWINDABLE_BACKUP_EVENTS_ENDPOINT = `${ REST_API_NAMESPACE }/site/backup/undo-event`;
export const REST_API_COUNT_BACKUP_ITEMS_ENDPOINT = `${ REST_API_NAMESPACE }/site/backup/count-items`;
export const REST_API_CHAT_AVAILABILITY_ENDPOINT = `${ REST_API_NAMESPACE }/chat/availability`;
export const REST_API_CHAT_AUTHENTICATION_ENDPOINT = `${ REST_API_NAMESPACE }/chat/authentication`;
export const REST_API_SITE_PRODUCTS_ENDPOINT = `${ REST_API_NAMESPACE }/site/products`;
export const REST_API_VIDEOPRESS_FEATURED_STATS = 'videopress/v1/stats/featured';
export const REST_API_SITE_DISMISS_BANNER = `${ REST_API_NAMESPACE }/site/dismiss-welcome-banner`;

export const getStatsHighlightsEndpoint = ( blogId: string ) =>
	`${ ODYSSEY_STATS_API_NAMESPACE }/sites/${ blogId }/stats/highlights`;

// Query names
export const QUERY_PRODUCT_KEY = 'product';
export const QUERY_ACTIVATE_PRODUCT_KEY = 'activate product';
export const QUERY_INSTALL_PRODUCT_KEY = 'install product';
export const QUERY_VIDEOPRESS_STATS_KEY = 'videopress stats';
export const QUERY_LICENSES_KEY = 'available licenses';
export const QUERY_CHAT_AVAILABILITY_KEY = 'chat availability';
export const QUERY_CHAT_AUTHENTICATION_KEY = 'chat authentication';
export const QUERY_BACKUP_HISTORY_KEY = 'backup history';
export const QUERY_BACKUP_STATS_KEY = 'backup stats';
export const QUERY_STATS_COUNTS_KEY = 'stats counts';
export const QUERY_DISMISS_WELCOME_BANNER_KEY = 'dismiss welcome banner';
export const QUERY_PURCHASES_KEY = 'purchases';
