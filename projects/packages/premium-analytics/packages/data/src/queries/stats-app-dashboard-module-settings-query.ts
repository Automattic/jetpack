/**
 * Internal dependencies
 */
import { statsAppProxyQuery } from './stats-app-query';
import type { StatsQueryParams } from '../utils/stats-params';

export const STATS_APP_DASHBOARD_MODULE_SETTINGS_NAME = 'dashboard-module-settings';
export const STATS_APP_DASHBOARD_MODULE_SETTINGS_VERSION = '2';
export const STATS_APP_DASHBOARD_MODULE_SETTINGS_ENDPOINT =
	'jetpack-stats-dashboard/module-settings';

export const statsAppDashboardModuleSettingsQuery = ( params: StatsQueryParams = {} ) =>
	statsAppProxyQuery( {
		name: STATS_APP_DASHBOARD_MODULE_SETTINGS_NAME,
		version: STATS_APP_DASHBOARD_MODULE_SETTINGS_VERSION,
		endpoint: STATS_APP_DASHBOARD_MODULE_SETTINGS_ENDPOINT,
		params,
	} );
