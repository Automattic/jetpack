/**
 * Internal dependencies
 */
import { statsAppProxyQuery } from './stats-app-query';
import type { StatsQueryParams } from '../utils/stats-params';

export const statsAppPlanUsageQuery = ( params: StatsQueryParams = {} ) =>
	statsAppProxyQuery( {
		name: 'plan-usage',
		version: '2',
		endpoint: 'jetpack-stats/usage',
		params,
	} );
