/**
 * Internal dependencies
 */
import { reportParamsToStatsQueryParams } from '../utils/stats-params';
import {
	statsProxyQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';

export type StatsSingleVideoParams = Partial< StatsReportParams > & {
	// `all` (wpcom #229903) returns every metric series in one response, plus
	// canonical whole-range totals when the request carries a date range.
	statType?: 'views' | 'impressions' | 'watch_time' | 'all';
};

const DEFAULT_SINGLE_VIDEO_PARAMS: StatsSingleVideoParams = {
	period: 'month',
};

export const statsSingleVideoQuery = (
	videoId: number,
	params: StatsSingleVideoParams = DEFAULT_SINGLE_VIDEO_PARAMS
): StatsReportQueryOptions< 'singleVideo' > => {
	const statsParams = reportParamsToStatsQueryParams( params );

	return statsProxyQuery( {
		name: 'single-video',
		version: '1.1',
		endpoint: `stats/video/${ videoId }`,
		params: {
			...statsParams,
			...( params.statType ? { statType: params.statType } : {} ),
		},
		sanitizer: 'singleVideo',
		enabled: Number.isInteger( videoId ) && videoId > 0,
	} );
};
