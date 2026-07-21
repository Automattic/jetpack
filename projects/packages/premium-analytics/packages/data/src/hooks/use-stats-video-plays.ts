/**
 * Internal dependencies
 */
import { mergeStatsVideoPlaysComparisonRows } from '../processing/stats';
import { statsVideoPlaysQuery } from '../queries/stats-video-plays-query';
import { statsVideoPlaysSummaryQuery } from '../queries/stats-video-plays-summary-query';
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
	// Complete-stats summaries use the same endpoint and normalized response,
	// but the API request must omit the sanitizer-only `summarize` switch.
	queryFactory: params =>
		params.complete_stats && params.summarize
			? statsVideoPlaysSummaryQuery( params )
			: statsVideoPlaysQuery( params ),
	reportSlug: 'video-plays',
	mergeComparisonRows: mergeStatsVideoPlaysComparisonRows,
	getOptions: splitStatsListOptions,
} );
