/**
 * Internal dependencies
 */
import {
	statsReportQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';

export type StatsTagsParams = StatsReportParams & {
	max?: number;
};

export const statsTagsQuery = ( params: StatsTagsParams ): StatsReportQueryOptions< 'tags' > =>
	statsReportQuery( 'tags', 'stats/tags', params, 'tags' );
