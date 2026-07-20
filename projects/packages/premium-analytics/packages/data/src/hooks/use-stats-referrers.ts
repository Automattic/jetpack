/**
 * External dependencies
 */
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { mergeStatsReferrersComparisonRows } from '../processing/stats';
import { statsReferrersQuery } from '../queries/stats-referrers-query';
import { useStatsReport } from './use-stats-report';
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

export function useStatsReferrers( params: StatsReportParams, options?: StatsReferrersOptions ) {
	const { maxRows, ...queryOptions } = options ?? {};
	const mergeComparisonRows = useCallback(
		(
			primary?: StatsNormalizedReport< StatsReferrersItem >,
			comparison?: StatsNormalizedReport< StatsReferrersItem >
		) => mergeStatsReferrersComparisonRows( primary, comparison, maxRows ),
		[ maxRows ]
	);

	return useStatsReport<
		StatsReportParams,
		StatsNormalizedReport< StatsReferrersItem >,
		StatsReferrersComparisonItem
	>( statsReferrersQuery, params, 'referrers', {
		...queryOptions,
		mergeComparisonRows,
	} );
}
