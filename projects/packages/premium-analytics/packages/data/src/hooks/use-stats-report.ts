/**
 * External dependencies
 */
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useReport } from './use-report';
import type { StatsReportParams } from '../queries/stats-query';
import type { UseQueryOptions } from '@tanstack/react-query';

type StatsComparisonRowsResult< TRow > = {
	rows: TRow[];
	hasComparison: boolean;
};

type StatsComparisonRowsMapper< TData, TRow > = (
	primaryReport?: TData,
	comparisonReport?: TData
) => StatsComparisonRowsResult< TRow >;

export type UseStatsOptions = {
	enabled?: boolean;
};

type UseStatsReportOptions< TData, TComparisonRow > = UseStatsOptions & {
	mergeComparisonRows?: StatsComparisonRowsMapper< TData, TComparisonRow >;
};

type StatsReportQueryFactory< TParams extends StatsReportParams, TData > = (
	params: TParams
) => UseQueryOptions< TData >;

export function useStatsReport<
	TParams extends StatsReportParams,
	TData,
	TComparisonRow = unknown,
>(
	queryFactory: StatsReportQueryFactory< TParams, TData >,
	params: TParams,
	reportSlugOrDisabledComparisonKey: string | string[],
	options?: UseStatsReportOptions< TData, TComparisonRow >
) {
	const disabledComparisonKey = Array.isArray( reportSlugOrDisabledComparisonKey )
		? reportSlugOrDisabledComparisonKey
		: [ 'stats', reportSlugOrDisabledComparisonKey, '__comparison__', 'disabled' ];

	const report = useReport( p => queryFactory( p as TParams ), params, {
		enabled: options?.enabled,
		disabledComparisonKey,
	} );

	const mergeComparisonRows = options?.mergeComparisonRows;
	const comparisonRows = useMemo(
		() => mergeComparisonRows?.( report.primary.data, report.comparison.data ),
		[ mergeComparisonRows, report.primary.data, report.comparison.data ]
	);

	return {
		...report,
		hasComparison: comparisonRows
			? report.hasComparison && comparisonRows.hasComparison
			: report.hasComparison,
		comparisonRows,
	};
}
