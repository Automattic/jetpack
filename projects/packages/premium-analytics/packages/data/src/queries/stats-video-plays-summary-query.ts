/**
 * Internal dependencies
 */
import { reportParamsToStatsQueryParams } from '../utils/stats-params';
import {
	statsProxyQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';

export type { StatsVideoPlaysSummary } from '../processing/stats';

export type StatsVideoPlaysSummaryParams = StatsReportParams;

export const statsVideoPlaysSummaryQuery = (
	params: StatsVideoPlaysSummaryParams
): StatsReportQueryOptions< 'videoPlaysSummary' > => {
	const rangeParams = { ...reportParamsToStatsQueryParams( params ) };

	// `complete_stats` plus `start_date` selects the endpoint's range-summary mode.
	// `summarize` is a separate mode switch and must not be sent with this request.
	delete rangeParams.summarize;

	return statsProxyQuery( {
		name: 'video-plays-summary',
		version: '1.1',
		endpoint: 'stats/video-plays',
		params: {
			...rangeParams,
			period: 'day',
			max: 0,
			complete_stats: 1,
		},
		sanitizer: 'videoPlaysSummary',
		enabled: !! ( rangeParams.end_date || rangeParams.date || rangeParams.start_date ),
	} );
};
