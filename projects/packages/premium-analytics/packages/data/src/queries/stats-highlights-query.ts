/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsReportQueryOptions } from './stats-query';
import type { StatsQueryParams } from '../utils/stats-params';

export type { StatsHighlightsResponse } from '../processing/stats';

export type StatsHighlightsParams = StatsQueryParams & {
	source?: string;
};

export const STATS_HIGHLIGHTS_STALE_TIME = 24 * 60 * 60 * 1000;

export const statsHighlightsQuery = (
	params: StatsHighlightsParams = {}
): StatsReportQueryOptions< 'highlights' > => {
	return {
		...statsProxyQuery( {
			name: 'highlights',
			version: '1.1',
			endpoint: 'stats/highlights',
			params,
			sanitizer: 'highlights',
		} ),
		staleTime: STATS_HIGHLIGHTS_STALE_TIME,
	};
};
