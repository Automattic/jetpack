export const JETPACK_SCAN_SLUG = 'jetpack_scan';

/**
 * URLs
 */
export const FREE_PLUGIN_SUPPORT_URL = 'https://wordpress.org/support/plugin/jetpack-protect/';
export const PAID_PLUGIN_SUPPORT_URL = 'https://jetpack.com/contact-support/?rel=support';

/**
 * Scan Status Constants
 */
export const SCAN_STATUS_SCHEDULED = 'scheduled';
export const SCAN_STATUS_SCANNING = 'scanning';
export const SCAN_STATUS_OPTIMISTICALLY_SCANNING = 'optimistically_scanning';
export const SCAN_STATUS_IDLE = 'idle';
export const SCAN_STATUS_UNAVAILABLE = 'unavailable';
export const SCAN_STATUS_PROVISIONING = 'provisioning';
export const SCAN_IN_PROGRESS_STATUSES = [
	SCAN_STATUS_PROVISIONING,
	SCAN_STATUS_SCHEDULED,
	SCAN_STATUS_SCANNING,
	SCAN_STATUS_OPTIMISTICALLY_SCANNING,
];

/**
 * Query names
 */
export const QUERY_CREDENTIALS_KEY = 'credentials';
export const QUERY_FIXERS_KEY = 'fixers';
export const QUERY_HAS_PLAN_KEY = 'has plan';
export const QUERY_HISTORY_KEY = 'history';
export const QUERY_ONBOARDING_PROGRESS_KEY = 'onboarding progress';
export const QUERY_PRODUCT_DATA_KEY = 'product data';
export const QUERY_SCAN_STATUS_KEY = 'scan status';
export const QUERY_WAF_KEY = 'waf';
export const QUERY_ACCOUNT_PROTECTION_KEY = 'account protection';
