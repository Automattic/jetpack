/**
 * External dependencies
 */
import {
	bucketStatsTimeSeries,
	toPostId,
	useStatsEmailClicksTimeSeries,
	useStatsEmailOpensTimeSeries,
	STATS_CHART_BUCKET_PERIODS,
	type StatsEmailTimeSeriesReport,
} from '@jetpack-premium-analytics/data';
import { reports } from '@jetpack-premium-analytics/icons';
import {
	MetricTabsChart,
	WidgetRoot,
	WidgetState,
	buildReportMetricSeries,
	defaultPeriodForInterval,
	useWidgetRootContext,
	type MetricTab,
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
	EmailTimeSeriesChartType,
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

function metricLabel( metric: EmailTimeSeriesMetric ): string {
	return metric === 'clicks'
		? __( 'Total clicks', 'jetpack-premium-analytics-pkg' )
		: __( 'Total opens', 'jetpack-premium-analytics-pkg' );
}

type EmailTimeSeriesReportProps = {
	metric: EmailTimeSeriesMetric;
	/** How the timeline is drawn. `MetricTabsChart` owns the default. */
	chartType?: EmailTimeSeriesChartType;
};

/**
 * Fetches the selected email's opens or clicks timeline over the dashboard
 * date range and draws it with the window total as the metric headline. The
 * endpoint reports daily buckets; weekly/monthly intervals aggregate them
 * client-side. Only the active metric's query runs. The post detail design
 * has no period-over-period comparison, so comparison report params are
 * ignored — they ride along in the URL untouched so dashboard state survives
 * the round trip, and every widget on this page disregards them.
 */
function EmailTimeSeriesReport( { metric, chartType }: EmailTimeSeriesReportProps ) {
	const { reportParams } = useWidgetRootContext();
	const postId = toPostId( reportParams.post_id );
	const hasSelection = postId > 0;
	const period = defaultPeriodForInterval( reportParams.interval, STATS_CHART_BUCKET_PERIODS );

	// Both hooks are called every render (hooks rule); only the active
	// metric's query is enabled.
	const opens = useStatsEmailOpensTimeSeries( postId, reportParams, {
		enabled: hasSelection && metric === 'opens',
	} );
	const clicks = useStatsEmailClicksTimeSeries( postId, reportParams, {
		enabled: hasSelection && metric === 'clicks',
	} );
	const active = metric === 'clicks' ? clicks : opens;

	const retry = useCallback( () => {
		active.refetch();
	}, [ active ] );

	const report = active.data as StatsEmailTimeSeriesReport | undefined;
	const field = METRIC_FIELDS[ metric ];

	const chartReport = useMemo( () => {
		if ( ! report ) {
			return undefined;
		}

		if ( period === 'day' ) {
			return report;
		}

		// The endpoint only buckets by hour/day; weeks/months aggregate client-side.
		return bucketStatsTimeSeries( report, period, point => {
			const value = Number( point[ field ] ?? 0 );

			return { value, [ field ]: value };
		} );
	}, [ report, period, field ] );

	// One metric: the headline is the window total (the timeline is summed per
	// bucket, so the sum of buckets is the range's opens/clicks).
	const metricTabs = useMemo< MetricTab[] >( () => {
		const points = chartReport
			? buildReportMetricSeries( {
					primary: chartReport,
					metrics: [ { key: field, label: metricLabel( metric ) } ],
			  } )[ 0 ]?.data ?? []
			: [];

		return [
			{
				key: field,
				label: metricLabel( metric ),
				value: points.reduce( ( sum, point ) => sum + point.value, 0 ),
				current: points,
			},
		];
	}, [ chartReport, field, metric ] );
	const hasPoints = ( chartReport?.data?.length ?? 0 ) > 0;

	return (
		<div className={ styles.root }>
			<WidgetState
				// An empty placeholder response is still data to React Query, so a
				// range change reports fetching rather than loading. Keep the loader
				// until that new range resolves instead of flashing the empty state.
				isLoading={ active.isLoading || ( ! hasPoints && active.isFetching ) }
				// `isFetching` is deliberately not passed: the chart renders its
				// own scoped overlay below, so WidgetState's full-widget one
				// would double up and cover the metric headline.
				isError={ active.isError }
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
				<MetricTabsChart
					metrics={ metricTabs }
					dataFormat={ DATA_FORMAT }
					chartType={ chartType }
					loading={ active.isFetching }
				/>
			</WidgetState>
		</div>
	);
}

/**
 * Email performance widget: a single email's opens or clicks over time —
 * the chart section of the legacy email detail page — with the window total
 * as the metric headline.
 */
export default function EmailTimeSeries( { attributes = {} }: EmailTimeSeriesWidgetProps ) {
	const metric = attributes.metric ?? 'opens';
	// Coerce unknown persisted values to the default.
	const chartType = attributes.chartType === 'bar' ? 'bar' : 'line';

	return (
		<WidgetRoot attributes={ attributes }>
			<EmailTimeSeriesReport metric={ metric } chartType={ chartType } />
		</WidgetRoot>
	);
}
