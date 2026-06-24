/**
 * Internal dependencies
 */
import { statsAppProxyQuery } from './stats-app-query';
import type { StatsQueryParams } from '../utils/stats-params';

export const statsAppPlanUsageQuery = < TData = unknown >( params: StatsQueryParams = {} ) =>
	statsAppProxyQuery< TData >( {
		name: 'plan-usage',
		version: '2',
		endpoint: 'jetpack-stats/usage',
		params,
	} );
