/**
 * Internal dependencies
 */
import { mergeStatsTopPostsComparisonRows } from '../processing/stats';
import { statsTopPostsQuery } from '../queries/stats-top-posts-query';
import { createStatsListReportHook } from './use-stats-report';
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

export const useStatsTopPosts = createStatsListReportHook<
	StatsReportParams,
	StatsNormalizedReport< StatsTopPostsItem >,
	StatsTopPostsComparisonItem,
	StatsTopPostsOptions,
	string[] | null | undefined
>( {
	queryFactory: statsTopPostsQuery,
	reportSlug: 'top-posts',
	mergeComparisonRows: ( primary, comparison, maxRows, postTypes ) =>
		mergeStatsTopPostsComparisonRows( primary, comparison, { maxRows, postTypes } ),
	getOptions: options => {
		const { maxRows, postTypes, ...queryOptions } = options ?? {};

		return { queryOptions, maxRows, mergeOption: postTypes };
	},
} );
