/**
 * Internal dependencies
 */
import { mergeStatsTopPostsComparisonRows } from '../processing/stats';
import { statsTopPostsQuery } from '../queries/stats-top-posts-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type {
	StatsNormalizedReport,
	StatsTopPostsComparisonItem,
	StatsTopPostsItem,
} from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';

type StatsTopPostsOptions = UseStatsOptions & {
	maxRows?: number;
	postTypes?: string[] | null;
};

export function useStatsTopPosts( params: StatsReportParams, options?: StatsTopPostsOptions ) {
	const { maxRows, postTypes, ...queryOptions } = options ?? {};

	return useStatsReport<
		StatsReportParams,
		StatsNormalizedReport< StatsTopPostsItem >,
		StatsTopPostsComparisonItem
	>( statsTopPostsQuery, params, 'top-posts', {
		...queryOptions,
		mergeComparisonRows: ( primary, comparison ) =>
			mergeStatsTopPostsComparisonRows( primary, comparison, { maxRows, postTypes } ),
	} );
}
