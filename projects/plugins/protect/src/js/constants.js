export const FREE_PLUGIN_SUPPORT_URL = 'https://wordpress.org/support/plugin/jetpack-protect/';

export const PAID_PLUGIN_SUPPORT_URL = 'https://jetpack.com/contact-support/?rel=support';

export const JETPACK_SCAN_SLUG = 'jetpack_scan';

/**
 * Scan Status Constants
 */
export const SCAN_STATUS_SCHEDULED = 'scheduled';
export const SCAN_STATUS_SCANNING = 'scanning';
export const SCAN_STATUS_OPTIMISTICALLY_SCANNING = 'optimistically_scanning';
export const SCAN_STATUS_IDLE = 'idle';
export const SCAN_STATUS_UNAVAILABLE = 'unavailable';
export const SCAN_IN_PROGRESS_STATUSES = [
	SCAN_STATUS_SCHEDULED,
	SCAN_STATUS_SCANNING,
	SCAN_STATUS_OPTIMISTICALLY_SCANNING,
];
