/**
 * Internal dependencies
 */
import { statsAppProxyQuery } from './stats-app-query';

export const STATS_APP_DASHBOARD_MODULES_NAME = 'dashboard-modules';
export const STATS_APP_DASHBOARD_MODULES_VERSION = '2';
export const STATS_APP_DASHBOARD_MODULES_ENDPOINT = 'jetpack-stats-dashboard/modules';

export const statsAppDashboardModulesQuery = < TData = unknown >() =>
	statsAppProxyQuery< TData >( {
		name: STATS_APP_DASHBOARD_MODULES_NAME,
		version: STATS_APP_DASHBOARD_MODULES_VERSION,
		endpoint: STATS_APP_DASHBOARD_MODULES_ENDPOINT,
	} );
