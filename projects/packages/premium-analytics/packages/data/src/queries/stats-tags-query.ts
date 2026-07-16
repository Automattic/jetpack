/**
 * Internal dependencies
 */
import { reportParamsToStatsQueryParams, type StatsQueryParams } from '../utils/stats-params';
import {
	statsProxyQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';

export type StatsTagsParams = Partial< StatsReportParams > & {
	max?: number;
};

function statsTagsParamsToApiParams( params: StatsTagsParams = {} ): StatsQueryParams {
	const statsParams = reportParamsToStatsQueryParams( params );
	const hasDateWindow = !! ( statsParams.end_date || statsParams.date || statsParams.start_date );

	if ( ! hasDateWindow ) {
		return {
			...( statsParams.max !== undefined ? { max: statsParams.max } : {} ),
		};
	}

	return {
		...statsParams,
		...( params.period === undefined ? { period: 'day' as const } : {} ),
		...( statsParams.summarize === undefined &&
		typeof statsParams.days === 'number' &&
		statsParams.days > 1
			? { summarize: 1 }
			: {} ),
	};
}

export const statsTagsQuery = ( params: StatsTagsParams = {} ): StatsReportQueryOptions< 'tags' > =>
	statsProxyQuery( {
		name: 'tags',
		version: '1.1',
		endpoint: 'stats/tags',
		params: statsTagsParamsToApiParams( params ),
		sanitizer: 'tags',
	} );
