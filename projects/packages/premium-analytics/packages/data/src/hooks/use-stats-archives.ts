/**
 * External dependencies
 */
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { mergeStatsArchivesComparisonRows } from '../processing/stats';
import { statsArchivesQuery } from '../queries/stats-archives-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type {
	StatsArchivesComparisonItem,
	StatsArchivesItem,
	StatsNormalizedReport,
} from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';

export type StatsArchivesResponse = StatsNormalizedReport< StatsArchivesItem >;

type StatsArchivesOptions = UseStatsOptions & {
	maxRows?: number;
};

export function useStatsArchives( params: StatsReportParams, options?: StatsArchivesOptions ) {
	const { maxRows, ...queryOptions } = options ?? {};
	const mergeComparisonRows = useCallback(
		(
			primary?: StatsNormalizedReport< StatsArchivesItem >,
			comparison?: StatsNormalizedReport< StatsArchivesItem >
		) => mergeStatsArchivesComparisonRows( primary, comparison, maxRows ),
		[ maxRows ]
	);

	return useStatsReport<
		StatsReportParams,
		StatsNormalizedReport< StatsArchivesItem >,
		StatsArchivesComparisonItem
	>( statsArchivesQuery, params, 'archives', {
		...queryOptions,
		mergeComparisonRows,
	} );
}
