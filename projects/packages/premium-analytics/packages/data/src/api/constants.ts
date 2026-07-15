/**
 * External dependencies
 */
import { isSimpleSite } from '@automattic/jetpack-script-data';

/**
 * Constants for API endpoints
 */
export const statsProxyPath = '/jetpack-premium-analytics/v1/proxy';
export const noticesPath = '/jetpack-premium-analytics/v1/notices';

// WPCOM Simple has no local notices endpoint: requests use the WPCOM Stats
// notices endpoint directly, dispatched by WPCOM's wp-admin apiFetch bridge.
export const wpcomSimpleNoticesPath = '/wpcom/v2/jetpack-stats-dashboard/notices';

export function getNoticesPath() {
	return isSimpleSite() ? wpcomSimpleNoticesPath : noticesPath;
}
