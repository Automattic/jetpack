/**
 * Internal dependencies
 */
import { mergeStatsVideoPlaysComparisonRows } from '../processing/stats';
import { statsVideoPlaysReportQuery } from '../queries/stats-video-plays-query';
import { createStatsListReportHook, splitStatsListOptions } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type {
	StatsNormalizedReport,
	StatsVideoPlaysComparisonItem,
	StatsVideoPlaysItem,
} from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';

type StatsVideoPlaysOptions = UseStatsOptions & {
	maxRows?: number;
};

export const useStatsVideoPlays = createStatsListReportHook<
	StatsReportParams,
	StatsNormalizedReport< StatsVideoPlaysItem >,
	StatsVideoPlaysComparisonItem,
	StatsVideoPlaysOptions
>( {
	queryFactory: statsVideoPlaysReportQuery,
	reportSlug: 'video-plays',
	mergeComparisonRows: mergeStatsVideoPlaysComparisonRows,
	getOptions: splitStatsListOptions,
} );
