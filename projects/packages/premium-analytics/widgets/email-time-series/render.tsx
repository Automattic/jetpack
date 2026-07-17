/**
 * External dependencies
 */
import {
	bucketStatsTimeSeries,
	useStatsEmailClicksTimeSeries,
	useStatsEmailOpensTimeSeries,
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
import { useMemo } from '@wordpress/element';
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
		? __( 'Total clicks', 'jetpack-premium-analytics' )
		: __( 'Total opens', 'jetpack-premium-analytics' );
}

/**
 * Resolves the email's post ID from the host-composed report params. `post_id`
 * is the shared single-resource "detail page" param.
 *
 * @param postId - The `post_id` report param.
 * @return The parsed post ID, or 0 when there is no usable selection.
 */
function toPostId( postId: string | number | undefined ): number {
	const parsed = typeof postId === 'number' ? postId : Number.parseInt( postId ?? '', 10 );

	return Number.isInteger( parsed ) && parsed > 0 ? parsed : 0;
}

type EmailTimeSeriesReportProps = {
	metric: EmailTimeSeriesMetric;
	granularity: EmailTimeSeriesGranularity;
};

/**
 * Fetches the selected email's opens or clicks timeline over the dashboard
 * date range and draws it as a line chart. The endpoint reports daily
 * buckets; the weekly granularity aggregates them client-side. Only the
 * active metric's query runs.
 *
 * @param {EmailTimeSeriesReportProps} props - The component props.
 * @return The widget content.
 */
function EmailTimeSeriesReport( { metric, granularity }: EmailTimeSeriesReportProps ) {
	const { reportParams } = useWidgetRootContext();
	const postId = toPostId( reportParams.post_id );
	const hasSelection = postId > 0;

	// Both hooks are called every render (hooks rule); only the active
	// metric's query is enabled, so a single request runs.
	const opens = useStatsEmailOpensTimeSeries( postId, reportParams, {
		enabled: hasSelection && metric === 'opens',
	} );
	const clicks = useStatsEmailClicksTimeSeries( postId, reportParams, {
		enabled: hasSelection && metric === 'clicks',
	} );
	const active = metric === 'clicks' ? clicks : opens;

	const report = active.data as StatsEmailTimeSeriesReport | undefined;
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

	const series = useMemo(
		() =>
			chartReport
				? buildReportMetricSeries( {
						primary: chartReport,
						metrics: [ { key: field, label: metricLabel( metric ) } ],
				  } )
				: [],
		[ chartReport, field, metric ]
	);
	const seriesStyles = useSeriesStyles( series );
	const hasPoints = ( chartReport?.data?.length ?? 0 ) > 0;

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ active.isLoading }
				isFetching={ active.isFetching }
				isError={ active.isError }
				isEmpty={ ! hasSelection || ! hasPoints }
				error={ {
					description: __(
						"We couldn't load this email's timeline. Please try again in a moment.",
						'jetpack-premium-analytics'
					),
					actions: [
						{ label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: active.refetch },
					],
				} }
				empty={ {
					icon: reports,
					description: hasSelection
						? __( 'No activity for this email in this period.', 'jetpack-premium-analytics' )
						: __( 'Open an email report to see its timeline here.', 'jetpack-premium-analytics' ),
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
