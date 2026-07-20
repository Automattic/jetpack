/**
 * Internal dependencies
 */
import { mergeStatsReferrersComparisonRows } from '../processing/stats';
import { statsReferrersQuery } from '../queries/stats-referrers-query';
import { createStatsListReportHook, splitStatsListOptions } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type {
	StatsNormalizedReport,
	StatsReferrersComparisonItem,
	StatsReferrersItem,
} from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';

type StatsReferrersOptions = UseStatsOptions & {
	maxRows?: number;
};

export const useStatsReferrers = createStatsListReportHook<
	StatsReportParams,
	StatsNormalizedReport< StatsReferrersItem >,
	StatsReferrersComparisonItem,
	StatsReferrersOptions
>( {
	queryFactory: statsReferrersQuery,
	reportSlug: 'referrers',
	mergeComparisonRows: mergeStatsReferrersComparisonRows,
	getOptions: splitStatsListOptions,
} );
