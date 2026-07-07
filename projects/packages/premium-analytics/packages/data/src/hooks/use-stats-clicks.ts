/**
 * Internal dependencies
 */
import { mergeStatsClicksComparisonRows } from '../processing/stats';
import { statsClicksQuery } from '../queries/stats-clicks-query';
import { useStatsReport } from './use-stats-report';
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

export function useStatsClicks( params: StatsReportParams, options?: StatsClicksOptions ) {
	const { maxRows, ...queryOptions } = options ?? {};

	return useStatsReport<
		StatsReportParams,
		StatsNormalizedReport< StatsClicksItem >,
		StatsClicksComparisonItem
	>( statsClicksQuery, params, 'clicks', {
		...queryOptions,
		mergeComparisonRows: ( primary, comparison ) =>
			mergeStatsClicksComparisonRows( primary, comparison, maxRows ),
	} );
}
