/**
 * Internal dependencies
 */
import {
	statsReportQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';
import type { StatsNormalizedReport, StatsTagsItem } from '../processing/stats';

export type StatsTagsResponse = StatsNormalizedReport< StatsTagsItem >;

export const statsTagsQuery = ( params: StatsReportParams ): StatsReportQueryOptions< 'tags' > =>
	statsReportQuery( 'tags', 'stats/tags', params, 'tags' );
