/**
 * External dependencies
 */
import {
	bucketStatsTimeSeries,
	getStatsChartBucketKey,
	toPostId,
	useStatsEmailClicksTimeSeries,
	useStatsEmailOpensTimeSeries,
	type StatsEmailTimeSeriesDataPoint,
	type StatsEmailTimeSeriesReport,
} from '@jetpack-premium-analytics/data';
import { reports } from '@jetpack-premium-analytics/icons';
import {
	ComparativeLineChart,
	WidgetRoot,
	WidgetState,
	buildReportMetricSeries,
	useSeriesStyles,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type {
	EmailTimeSeriesAttributes,
	EmailTimeSeriesGranularity,
	EmailTimeSeriesMetric,
} from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type EmailTimeSeriesRenderAttributes = EmailTimeSeriesAttributes &
	Partial< ReportParamsFieldAttributes >;
type EmailTimeSeriesWidgetProps = WidgetRenderProps< EmailTimeSeriesRenderAttributes >;

const DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

/** The timeline field each metric charts. */
const METRIC_FIELDS: Record< EmailTimeSeriesMetric, 'opens_count' | 'clicks_count' > = {
	opens: 'opens_count',
	clicks: 'clicks_count',
};

/**
 * The chart line's label for a metric.
 *
 * @param metric - The active metric.
 * @return Translated series label.
 */
function metricLabel( metric: EmailTimeSeriesMetric ): string {
	return metric === 'clicks'
		? __( 'Total clicks', 'jetpack-premium-analytics-pkg' )
		: __( 'Total opens', 'jetpack-premium-analytics-pkg' );
}

type EmailTimeSeriesReportProps = {
	metric: EmailTimeSeriesMetric;
	granularity: EmailTimeSeriesGranularity;
};

/**
 * Fetches the selected email's opens or clicks timeline over the dashboard
 * date range and draws it as a line chart; with the date picker's comparison
 * on, the compare window is fetched as a second request and drawn as a dashed
 * overlay (legend switches to date-range labels). The endpoint reports daily
 * buckets; weekly/monthly granularities aggregate them client-side, with the
 * comparison bucketed relative to the primary layout. Only the active
 * metric's queries run.
 *
 * @param {EmailTimeSeriesReportProps} props - The component props.
 * @return The widget content.
 */
function EmailTimeSeriesReport( { metric, granularity }: EmailTimeSeriesReportProps ) {
	const { reportParams } = useWidgetRootContext();
	const postId = toPostId( reportParams.post_id );
	const hasSelection = postId > 0;
	// Comparison dates only survive the report-param normalizer when the
	// comparison toggle is on, so their presence is the comparison signal.
	const hasComparison = !! ( reportParams.compare_from && reportParams.compare_to );

	// The endpoint has no comparison mode of its own, but it accepts any
	// window (`date` is the window start), so the comparison period is just a
	// second request scoped to the compare range.
	const comparisonParams = useMemo(
		() => ( {
			...reportParams,
			from: reportParams.compare_from ?? '',
			to: reportParams.compare_to ?? '',
			preset: undefined,
			comp: undefined,
			compare_from: undefined,
			compare_to: undefined,
			compare_preset: undefined,
		} ),
		[ reportParams ]
	);

	// All hooks are called every render (hooks rule); only the active
	// metric's queries are enabled, and the comparison window only fetches
	// while the date picker's comparison is on.
	const opens = useStatsEmailOpensTimeSeries( postId, reportParams, {
		enabled: hasSelection && metric === 'opens',
	} );
	const clicks = useStatsEmailClicksTimeSeries( postId, reportParams, {
		enabled: hasSelection && metric === 'clicks',
	} );
	const opensComparison = useStatsEmailOpensTimeSeries( postId, comparisonParams, {
		enabled: hasSelection && hasComparison && metric === 'opens',
	} );
	const clicksComparison = useStatsEmailClicksTimeSeries( postId, comparisonParams, {
		enabled: hasSelection && hasComparison && metric === 'clicks',
	} );
	const active = metric === 'clicks' ? clicks : opens;
	const activeComparison = metric === 'clicks' ? clicksComparison : opensComparison;

	// A comparison failure must not silently drop the overlay while the solid
	// line stays: surface the error and retry both windows together.
	const isComparisonError =
		hasComparison && activeComparison.isError && activeComparison.data === undefined;
	const retry = useCallback( () => {
		active.refetch();
		if ( hasComparison ) {
			activeComparison.refetch();
		}
	}, [ active, activeComparison, hasComparison ] );

	const report = active.data as StatsEmailTimeSeriesReport | undefined;
	const comparisonReport = hasComparison
		? ( activeComparison.data as StatsEmailTimeSeriesReport | undefined )
		: undefined;
	const field = METRIC_FIELDS[ metric ];

	const chartReport = useMemo( () => {
		if ( ! report ) {
			return undefined;
		}

		if ( granularity === 'day' ) {
			return report;
		}

		// The endpoint only buckets by hour/day; weeks/months aggregate client-side.
		return bucketStatsTimeSeries( report, granularity, point => {
			const value = Number( point[ field ] ?? 0 );

			return { value, [ field ]: value };
		} );
	}, [ report, granularity, field ] );

	// The comparison window is the same length as the primary for most presets,
	// but previous-month/-year can differ (a 31-day month compared with a
	// 28-day one), and either window can sit differently against calendar
	// boundaries. So instead of calendar-bucketing the comparison directly —
	// which could yield a different bucket count and misalign the overlay —
	// each comparison day joins the bucket of the primary day at the same
	// index. Comparison days past the primary window (a longer previous period)
	// fold into the last bucket, so no comparison data is dropped and the
	// overlay always mirrors the primary series' bucket layout.
	const comparisonChartReport = useMemo( () => {
		if ( ! report || ! comparisonReport ) {
			return undefined;
		}

		if ( granularity === 'day' ) {
			return comparisonReport;
		}

		const primaryBucketKeys = report.data.map( primaryPoint =>
			getStatsChartBucketKey( primaryPoint.time_interval, granularity )
		);
		if ( ! primaryBucketKeys.length ) {
			return undefined;
		}

		const totals = new Map< string, { start: StatsEmailTimeSeriesDataPoint; value: number } >();
		const order: string[] = [];
		comparisonReport.data.forEach( ( comparisonPoint: StatsEmailTimeSeriesDataPoint, index ) => {
			const key = primaryBucketKeys[ Math.min( index, primaryBucketKeys.length - 1 ) ];
			const value = Number( comparisonPoint[ field ] ?? 0 );
			const bucket = totals.get( key );
			if ( bucket ) {
				bucket.value += value;
			} else {
				totals.set( key, { start: comparisonPoint, value } );
				order.push( key );
			}
		} );

		return {
			...comparisonReport,
			data: order.map( key => {
				const bucket = totals.get( key )!;

				return { ...bucket.start, value: bucket.value, [ field ]: bucket.value };
			} ),
		};
	}, [ report, comparisonReport, granularity, field ] );

	const series = useMemo(
		() =>
			chartReport
				? buildReportMetricSeries( {
						primary: chartReport,
						comparison: comparisonChartReport,
						metrics: [ { key: field, label: metricLabel( metric ) } ],
				  } )
				: [],
		[ chartReport, comparisonChartReport, field, metric ]
	);
	const seriesStyles = useSeriesStyles( series );
	const hasPoints = ( chartReport?.data?.length ?? 0 ) > 0;

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ active.isLoading }
				isFetching={ active.isFetching || ( hasComparison && activeComparison.isFetching ) }
				isError={ active.isError || isComparisonError }
				isEmpty={ ! hasSelection || ! hasPoints }
				error={ {
					description: __(
						"We couldn't load this email's timeline. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: retry } ],
				} }
				empty={ {
					icon: reports,
					description: hasSelection
						? __( 'No activity for this email in this period.', 'jetpack-premium-analytics-pkg' )
						: __(
								'Open an email report to see its timeline here.',
								'jetpack-premium-analytics-pkg'
						  ),
				} }
			>
				<ComparativeLineChart
					className={ styles.chart }
					series={ series }
					styles={ seriesStyles }
					dataFormat={ DATA_FORMAT }
				/>
			</WidgetState>
		</div>
	);
}

/**
 * Email performance widget: a single email's opens or clicks over time —
 * the chart section of the legacy email detail page.
 *
 * @param {EmailTimeSeriesWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function EmailTimeSeries( { attributes = {} }: EmailTimeSeriesWidgetProps ) {
	const metric = attributes.metric ?? 'opens';
	const granularity = attributes.granularity ?? 'day';

	return (
		<WidgetRoot attributes={ attributes }>
			<EmailTimeSeriesReport metric={ metric } granularity={ granularity } />
		</WidgetRoot>
	);
}
