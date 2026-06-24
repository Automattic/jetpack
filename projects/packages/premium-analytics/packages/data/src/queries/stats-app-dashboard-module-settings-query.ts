/**
 * Internal dependencies
 */
import { statsAppProxyQuery } from './stats-app-query';
import type { StatsQueryParams } from '../utils/stats-params';

export const statsAppDashboardModuleSettingsQuery = ( params: StatsQueryParams = {} ) =>
	statsAppProxyQuery( {
		name: 'dashboard-module-settings',
		version: '2',
		endpoint: 'jetpack-stats-dashboard/module-settings',
		params,
	} );
