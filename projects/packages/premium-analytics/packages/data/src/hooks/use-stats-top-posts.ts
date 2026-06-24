/**
 * External dependencies
 */
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { statsTopPostsQuery } from '../queries/stats-top-posts-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type {
	StatsNormalizedDataPoint,
	StatsNormalizedReport,
	StatsTopPostsItem,
} from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';

type NumericStatsTopPostsKey = {
	[ Key in keyof StatsTopPostsItem ]: StatsTopPostsItem[ Key ] extends number ? Key : never;
}[ keyof StatsTopPostsItem ];

export type StatsTopPostsPrimaryMetric = NumericStatsTopPostsKey;

export type StatsTopPostsPrimaryMetricOptions<
	TMetric extends StatsTopPostsPrimaryMetric = StatsTopPostsPrimaryMetric,
> = {
	/**
	 * Numeric top-posts field to expose as the generic `value`.
	 */
	primaryMetric: TMetric;
	/**
	 * Display label for the chosen metric.
	 */
	primaryMetricLabel: string;
};

export type StatsTopPostsPrimaryValueItem<
	TMetric extends StatsTopPostsPrimaryMetric = StatsTopPostsPrimaryMetric,
> = Omit< StatsTopPostsItem, 'children' > & {
	value: number;
	valueKey: TMetric;
	valueLabel: string;
	href: string | null;
	children: Array< StatsTopPostsPrimaryValueItem< TMetric > > | null;
};

export type UseStatsTopPostsOptions<
	TMetric extends StatsTopPostsPrimaryMetric = StatsTopPostsPrimaryMetric,
> = UseStatsOptions &
	(
		| {
				primaryMetric?: undefined;
				primaryMetricLabel?: undefined;
		  }
		| StatsTopPostsPrimaryMetricOptions< TMetric >
	);

type UseStatsReportResult = ReturnType< typeof useStatsReport >;

type UseStatsTopPostsResult< TItem extends StatsTopPostsItem > = Omit<
	UseStatsReportResult,
	'primary' | 'comparison'
> & {
	primary: Omit< UseStatsReportResult[ 'primary' ], 'data' > & {
		data: StatsNormalizedReport< TItem > | undefined;
	};
	comparison: Omit< UseStatsReportResult[ 'comparison' ], 'data' > & {
		data: StatsNormalizedReport< TItem > | undefined;
	};
};

function withPrimaryMetricItem< TMetric extends StatsTopPostsPrimaryMetric >(
	item: StatsTopPostsItem,
	options: StatsTopPostsPrimaryMetricOptions< TMetric >
): StatsTopPostsPrimaryValueItem< TMetric > {
	return {
		...item,
		value: item[ options.primaryMetric ],
		valueKey: options.primaryMetric,
		valueLabel: options.primaryMetricLabel,
		href: item.link,
		children: item.children?.map( child => withPrimaryMetricItem( child, options ) ) ?? null,
	};
}

export function withStatsTopPostsPrimaryMetric<
	TMetric extends StatsTopPostsPrimaryMetric = StatsTopPostsPrimaryMetric,
>(
	report: StatsNormalizedReport< StatsTopPostsItem > | undefined,
	options: StatsTopPostsPrimaryMetricOptions< TMetric > | undefined
): StatsNormalizedReport< StatsTopPostsPrimaryValueItem< TMetric > > | undefined {
	if ( ! report || ! options ) {
		return report as StatsNormalizedReport< StatsTopPostsPrimaryValueItem< TMetric > > | undefined;
	}

	return {
		...report,
		data: report.data.map(
			( point ): StatsNormalizedDataPoint< StatsTopPostsPrimaryValueItem< TMetric > > => ( {
				...point,
				items: point.items.map( item => withPrimaryMetricItem( item, options ) ),
			} )
		),
	};
}

export function useStatsTopPosts< TMetric extends StatsTopPostsPrimaryMetric >(
	params: StatsReportParams,
	options: UseStatsOptions & StatsTopPostsPrimaryMetricOptions< TMetric >
): UseStatsTopPostsResult< StatsTopPostsPrimaryValueItem< TMetric > >;

export function useStatsTopPosts(
	params: StatsReportParams,
	options?: UseStatsOptions
): UseStatsTopPostsResult< StatsTopPostsItem >;

export function useStatsTopPosts<
	TMetric extends StatsTopPostsPrimaryMetric = StatsTopPostsPrimaryMetric,
>(
	params: StatsReportParams,
	options?: UseStatsTopPostsOptions< TMetric >
):
	| UseStatsTopPostsResult< StatsTopPostsItem >
	| UseStatsTopPostsResult< StatsTopPostsPrimaryValueItem< TMetric > > {
	const report = useStatsReport(
		statsTopPostsQuery,
		params,
		'top-posts',
		options
	) as UseStatsTopPostsResult< StatsTopPostsItem >;
	const primaryMetric = options?.primaryMetric;
	const primaryMetricLabel = options?.primaryMetricLabel;
	const primaryMetricOptions = useMemo( () => {
		if ( ! primaryMetric ) {
			return undefined;
		}

		return {
			primaryMetric,
			primaryMetricLabel,
		} as StatsTopPostsPrimaryMetricOptions< TMetric >;
	}, [ primaryMetric, primaryMetricLabel ] );

	const primaryData = useMemo(
		() =>
			withStatsTopPostsPrimaryMetric(
				report.primary.data as StatsNormalizedReport< StatsTopPostsItem > | undefined,
				primaryMetricOptions
			),
		[ report.primary.data, primaryMetricOptions ]
	);
	const comparisonData = useMemo(
		() =>
			withStatsTopPostsPrimaryMetric(
				report.comparison.data as StatsNormalizedReport< StatsTopPostsItem > | undefined,
				primaryMetricOptions
			),
		[ report.comparison.data, primaryMetricOptions ]
	);

	if ( ! primaryMetricOptions ) {
		return report;
	}

	return {
		...report,
		primary: {
			...report.primary,
			data: primaryData,
		},
		comparison: {
			...report.comparison,
			data: comparisonData,
		},
	} as UseStatsTopPostsResult< StatsTopPostsPrimaryValueItem< TMetric > >;
}
