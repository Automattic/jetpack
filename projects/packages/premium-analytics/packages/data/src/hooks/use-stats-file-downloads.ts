/**
 * Internal dependencies
 */
import { mergeStatsFileDownloadsComparisonRows } from '../processing/stats';
import { statsFileDownloadsQuery } from '../queries/stats-file-downloads-query';
import { createStatsListReportHook } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type {
	StatsFileDownloadsComparisonItem,
	StatsFileDownloadsItem,
	StatsNormalizedReport,
} from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';

type StatsFileDownloadsOptions = UseStatsOptions & {
	maxRows?: number;
};

export const useStatsFileDownloads = createStatsListReportHook<
	StatsReportParams,
	StatsNormalizedReport< StatsFileDownloadsItem >,
	StatsFileDownloadsComparisonItem,
	StatsFileDownloadsOptions
>( {
	queryFactory: statsFileDownloadsQuery,
	reportSlug: 'file-downloads',
	mergeComparisonRows: mergeStatsFileDownloadsComparisonRows,
} );
