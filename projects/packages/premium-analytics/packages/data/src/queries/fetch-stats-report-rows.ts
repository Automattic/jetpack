/**
 * Internal dependencies
 */
import {
	mergeStatsArchivesComparisonRows,
	mergeStatsTopPostsComparisonRows,
	type StatsArchivesComparisonItem,
	type StatsTopPostsComparisonItem,
} from '../processing/stats';
import { queryClient } from '../providers/query-client-provider';
import { withoutComparison } from '../utils/without-comparison';
import { statsArchivesQuery } from './stats-archives-query';
import { statsTopPostsQuery } from './stats-top-posts-query';
import type { StatsReportParams } from './stats-query';

// Same primary query key and row processing as the report hooks; no comparison
// request, because exports carry no previous-period columns.

/** Fetch every top-posts row for a report window, ranked as the report ranks them. */
export async function fetchStatsTopPostsRows(
	params: StatsReportParams
): Promise< StatsTopPostsComparisonItem[] > {
	const report = await queryClient.fetchQuery( statsTopPostsQuery( withoutComparison( params ) ) );
	return mergeStatsTopPostsComparisonRows( report, undefined ).rows;
}

/** Fetch the archives tree for a report window, sorted as the report sorts it. */
export async function fetchStatsArchivesRows(
	params: StatsReportParams
): Promise< StatsArchivesComparisonItem[] > {
	const report = await queryClient.fetchQuery( statsArchivesQuery( withoutComparison( params ) ) );
	return mergeStatsArchivesComparisonRows( report, undefined ).rows;
}
