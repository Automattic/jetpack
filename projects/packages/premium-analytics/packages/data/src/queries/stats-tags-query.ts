/**
 * Internal dependencies
 */
import { reportParamsToStatsQueryParams } from '../utils/stats-params';
import {
	statsProxyQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';
import type { StatsProxyParams } from '../api';

export type StatsTagsParams = Partial< StatsReportParams > & {
	max?: number;
};

function statsTagsParamsToApiParams( params: StatsTagsParams = {} ): StatsProxyParams {
	const statsParams = reportParamsToStatsQueryParams( params );
	const date = statsParams.date ?? statsParams.end_date;

	return {
		...( date ? { date } : {} ),
		...( statsParams.max !== undefined ? { max: statsParams.max } : {} ),
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
