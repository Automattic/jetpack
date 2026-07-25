/**
 * External dependencies
 */
import { useCallback, useMemo } from 'react';
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

export type StatsListReportOptions = UseStatsOptions & {
	maxRows?: number;
};

type StatsListReportHookConfig<
	TParams extends StatsReportParams,
	TData,
	TComparisonRow,
	TOptions extends StatsListReportOptions,
	TMergeOption,
> = {
	queryFactory: StatsReportQueryFactory< TParams, TData >;
	reportSlug: string;
	mergeComparisonRows: (
		primaryReport: TData | undefined,
		comparisonReport: TData | undefined,
		maxRows: number | undefined,
		mergeOption: TMergeOption
	) => StatsComparisonRowsResult< TComparisonRow >;
	// Required so that narrowing `TMergeOption` cannot leave the merge callback
	// receiving an `undefined` the type says is impossible. Modules with no merge
	// option pass `splitStatsListOptions`.
	getOptions: ( options: TOptions | undefined ) => {
		queryOptions: UseStatsOptions;
		maxRows?: number;
		mergeOption: TMergeOption;
	};
};

/**
 * The `getOptions` mapper for list reports whose merge helper takes no extra option:
 * splits `maxRows` off the query options and leaves the merge option undefined.
 *
 * @param options - The hook's caller options.
 * @return The split query options, row cap, and (absent) merge option.
 */
export function splitStatsListOptions( options: StatsListReportOptions | undefined ): {
	queryOptions: UseStatsOptions;
	maxRows?: number;
	mergeOption: undefined;
} {
	const { maxRows, ...queryOptions } = options ?? {};

	return { queryOptions, maxRows, mergeOption: undefined };
}

export function createStatsListReportHook<
	TParams extends StatsReportParams,
	TData,
	TComparisonRow,
	TOptions extends StatsListReportOptions = StatsListReportOptions,
	TMergeOption = undefined,
>( {
	queryFactory,
	reportSlug,
	mergeComparisonRows: mergeRows,
	getOptions,
}: StatsListReportHookConfig< TParams, TData, TComparisonRow, TOptions, TMergeOption > ) {
	return function useStatsListReport( params: TParams, options?: TOptions ) {
		const { queryOptions, maxRows, mergeOption } = getOptions( options );
		const mergeComparisonRows = useCallback(
			( primaryReport?: TData, comparisonReport?: TData ) =>
				mergeRows( primaryReport, comparisonReport, maxRows, mergeOption ),
			[ maxRows, mergeOption ]
		);

		return useStatsReport< TParams, TData, TComparisonRow >( queryFactory, params, reportSlug, {
			...queryOptions,
			mergeComparisonRows,
		} );
	};
}

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
