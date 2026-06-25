/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsReportQueryOptions } from './stats-query';

export type StatsInsightsParams = Record< string, never >;

export type { StatsInsightsResponse, StatsInsightsYear } from '../processing/stats';

export const statsInsightsQuery = (
	params: StatsInsightsParams = {}
): StatsReportQueryOptions< 'insights' > =>
	statsProxyQuery( {
		name: 'insights',
		version: '1.1',
		endpoint: 'stats/insights',
		params,
		sanitizer: 'insights',
	} );
