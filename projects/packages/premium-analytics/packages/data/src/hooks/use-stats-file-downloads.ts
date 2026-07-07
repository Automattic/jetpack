/**
 * External dependencies
 */
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { mergeStatsFileDownloadsComparisonRows } from '../processing/stats';
import { statsFileDownloadsQuery } from '../queries/stats-file-downloads-query';
import { useStatsReport } from './use-stats-report';
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

export function useStatsFileDownloads(
	params: StatsReportParams,
	options?: StatsFileDownloadsOptions
) {
	const { maxRows, ...queryOptions } = options ?? {};
	const mergeComparisonRows = useCallback(
		(
			primary?: StatsNormalizedReport< StatsFileDownloadsItem >,
			comparison?: StatsNormalizedReport< StatsFileDownloadsItem >
		) => mergeStatsFileDownloadsComparisonRows( primary, comparison, maxRows ),
		[ maxRows ]
	);

	return useStatsReport<
		StatsReportParams,
		StatsNormalizedReport< StatsFileDownloadsItem >,
		StatsFileDownloadsComparisonItem
	>( statsFileDownloadsQuery, params, 'file-downloads', {
		...queryOptions,
		mergeComparisonRows,
	} );
}
