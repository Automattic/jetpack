/**
 * Internal dependencies
 */
import { mergeStatsClicksComparisonRows } from '../processing/stats';
import { statsClicksQuery } from '../queries/stats-clicks-query';
import { createStatsListReportHook } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type {
	StatsClicksComparisonItem,
	StatsClicksItem,
	StatsNormalizedReport,
} from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';

type StatsClicksOptions = UseStatsOptions & {
	maxRows?: number;
};

export const useStatsClicks = createStatsListReportHook<
	StatsReportParams,
	StatsNormalizedReport< StatsClicksItem >,
	StatsClicksComparisonItem,
	StatsClicksOptions
>( {
	queryFactory: statsClicksQuery,
	reportSlug: 'clicks',
	mergeComparisonRows: mergeStatsClicksComparisonRows,
} );
