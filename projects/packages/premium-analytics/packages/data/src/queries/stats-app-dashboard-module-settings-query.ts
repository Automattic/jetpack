/**
 * Internal dependencies
 */
import { statsAppProxyQuery } from './stats-app-query';

export const STATS_APP_DASHBOARD_MODULE_SETTINGS_NAME = 'dashboard-module-settings';
export const STATS_APP_DASHBOARD_MODULE_SETTINGS_VERSION = '2';
export const STATS_APP_DASHBOARD_MODULE_SETTINGS_ENDPOINT =
	'jetpack-stats-dashboard/module-settings';

export const statsAppDashboardModuleSettingsQuery = < TData = unknown >() =>
	statsAppProxyQuery< TData >( {
		name: STATS_APP_DASHBOARD_MODULE_SETTINGS_NAME,
		version: STATS_APP_DASHBOARD_MODULE_SETTINGS_VERSION,
		endpoint: STATS_APP_DASHBOARD_MODULE_SETTINGS_ENDPOINT,
	} );
