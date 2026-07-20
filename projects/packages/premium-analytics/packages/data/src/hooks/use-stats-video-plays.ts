/**
 * External dependencies
 */
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { mergeStatsVideoPlaysComparisonRows } from '../processing/stats';
import { statsVideoPlaysQuery } from '../queries/stats-video-plays-query';
import { statsVideoPlaysSummaryQuery } from '../queries/stats-video-plays-summary-query';
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
	// The complete-stats range summary uses the same endpoint and normalized
	// response as the standard report, but its API request must omit the
	// `summarize` mode switch. Reuse the dedicated query factory that keeps
	// `summarize` sanitizer-only while preserving this hook's comparison and
	// row-merging contract for callers.
	const queryFactory =
		params.complete_stats && params.summarize ? statsVideoPlaysSummaryQuery : statsVideoPlaysQuery;
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
	>( queryFactory, params, 'video-plays', {
		...queryOptions,
		mergeComparisonRows,
	} );
}
