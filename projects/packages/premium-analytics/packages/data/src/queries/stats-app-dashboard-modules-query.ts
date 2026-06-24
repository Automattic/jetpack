/**
 * Internal dependencies
 */
import { statsAppProxyQuery } from './stats-app-query';
import type { StatsQueryParams } from '../utils/stats-params';

export const statsAppDashboardModulesQuery = ( params: StatsQueryParams = {} ) =>
	statsAppProxyQuery( {
		name: 'dashboard-modules',
		version: '2',
		endpoint: 'jetpack-stats-dashboard/modules',
		params,
	} );
