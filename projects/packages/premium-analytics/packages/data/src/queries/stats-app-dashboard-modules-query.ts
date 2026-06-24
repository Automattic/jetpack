/**
 * Internal dependencies
 */
import { statsAppProxyQuery } from './stats-app-query';
import type { StatsQueryParams } from '../utils/stats-params';

export const STATS_APP_DASHBOARD_MODULES_NAME = 'dashboard-modules';
export const STATS_APP_DASHBOARD_MODULES_VERSION = '2';
export const STATS_APP_DASHBOARD_MODULES_ENDPOINT = 'jetpack-stats-dashboard/modules';

export const statsAppDashboardModulesQuery = < TData = unknown >( params: StatsQueryParams = {} ) =>
	statsAppProxyQuery< TData >( {
		name: STATS_APP_DASHBOARD_MODULES_NAME,
		version: STATS_APP_DASHBOARD_MODULES_VERSION,
		endpoint: STATS_APP_DASHBOARD_MODULES_ENDPOINT,
		params,
	} );
