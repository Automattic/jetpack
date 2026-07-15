/**
 * External dependencies
 */
import { isSimpleSite } from '@automattic/jetpack-script-data';

/**
 * Constants for API endpoints
 */
export const statsProxyPath = '/jetpack-premium-analytics/v1/proxy';
export const reportsPath = `${ statsProxyPath }/v2/analytics/reports`;
export const noticesPath = '/jetpack-premium-analytics/v1/notices';

// WPCOM Simple has no local proxy or notices endpoint: requests use public-api
// namespaces directly, dispatched by WPCOM's wp-admin apiFetch bridge.
export const wpcomSimpleReportsPath = '/wpcom/v2/analytics/reports';
export const wpcomSimpleNoticesPath = '/wpcom/v2/jetpack-stats-dashboard/notices';

export function getReportsPath() {
	return isSimpleSite() ? wpcomSimpleReportsPath : reportsPath;
}

export function getNoticesPath() {
	return isSimpleSite() ? wpcomSimpleNoticesPath : noticesPath;
}
