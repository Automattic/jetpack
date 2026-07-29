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
	statType?: 'views' | 'impressions' | 'watch_time';
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
