/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsReportQueryOptions } from './stats-query';
import type { StatsQueryParams } from '../utils/stats-params';

export type {
	StatsHighlightsPeriod,
	StatsHighlightsRange,
	StatsHighlightsRawPeriod,
	StatsHighlightsRawRange,
	StatsHighlightsRawResponse,
	StatsHighlightsResponse,
} from '../processing/stats';

export type StatsHighlightsParams = StatsQueryParams & {
	source?: string;
};

export const statsHighlightsQuery = (
	params: StatsHighlightsParams = {}
): StatsReportQueryOptions< 'highlights' > =>
	statsProxyQuery( {
		name: 'highlights',
		version: '1.1',
		endpoint: 'stats/highlights',
		params,
		sanitizer: 'highlights',
	} );
