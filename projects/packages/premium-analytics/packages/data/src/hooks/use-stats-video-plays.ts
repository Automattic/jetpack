/**
 * External dependencies
 */
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { mergeStatsVideoPlaysComparisonRows } from '../processing/stats';
import { statsVideoPlaysQuery } from '../queries/stats-video-plays-query';
import { useStatsReport } from './use-stats-report';
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

export function useStatsVideoPlays( params: StatsReportParams, options?: StatsVideoPlaysOptions ) {
	const { maxRows, ...queryOptions } = options ?? {};
	const mergeComparisonRows = useCallback(
		(
			primary?: StatsNormalizedReport< StatsVideoPlaysItem >,
			comparison?: StatsNormalizedReport< StatsVideoPlaysItem >
		) => mergeStatsVideoPlaysComparisonRows( primary, comparison, maxRows ),
		[ maxRows ]
	);

	return useStatsReport<
		StatsReportParams,
		StatsNormalizedReport< StatsVideoPlaysItem >,
		StatsVideoPlaysComparisonItem
	>( statsVideoPlaysQuery, params, 'video-plays', {
		...queryOptions,
		mergeComparisonRows,
	} );
}
