/**
 * Internal dependencies
 */
import { reportParamsToStatsQueryParams } from '../utils/stats-params';
import {
	statsProxyQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';

export type StatsVideoPlaysSummaryParams = StatsReportParams;

export const statsVideoPlaysSummaryQuery = (
	params: StatsVideoPlaysSummaryParams
): StatsReportQueryOptions< 'videoPlays' > => {
	const rangeParams = reportParamsToStatsQueryParams( params );
	const endDate = rangeParams.end_date ?? rangeParams.date;

	// Match Calypso's custom-range summary request. Do not spread `rangeParams`:
	// its generic `days` field is not part of this endpoint's legacy request.
	return statsProxyQuery( {
		name: 'video-plays-summary',
		version: '1.1',
		endpoint: 'stats/video-plays',
		params: {
			period: 'day',
			...( rangeParams.start_date ? { start_date: rangeParams.start_date } : {} ),
			...( endDate ? { date: endDate } : {} ),
			max: 0,
			summarize: 1,
			complete_stats: 1,
		},
		sanitizer: 'videoPlays',
		enabled: !! ( endDate || rangeParams.start_date ),
	} );
};
