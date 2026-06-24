/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsReportQueryOptions } from './stats-query';
import type { StatsQueryParams } from '../utils/stats-params';

export type { StatsHighlightsResponse } from '../processing/stats';

export const statsHighlightsQuery = (
	params: StatsQueryParams = {}
): StatsReportQueryOptions< 'highlights' > =>
	statsProxyQuery( {
		name: 'highlights',
		version: '1.1',
		endpoint: 'stats/highlights',
		params,
		sanitizer: 'highlights',
	} );
