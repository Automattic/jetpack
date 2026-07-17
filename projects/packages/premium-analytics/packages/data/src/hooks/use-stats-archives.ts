/**
 * Internal dependencies
 */
import { mergeStatsArchivesComparisonRows } from '../processing/stats';
import { statsArchivesQuery } from '../queries/stats-archives-query';
import { createStatsListReportHook } from './use-stats-report';
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

export const useStatsArchives = createStatsListReportHook<
	StatsReportParams,
	StatsNormalizedReport< StatsArchivesItem >,
	StatsArchivesComparisonItem,
	StatsArchivesOptions
>( {
	queryFactory: statsArchivesQuery,
	reportSlug: 'archives',
	mergeComparisonRows: mergeStatsArchivesComparisonRows,
} );
