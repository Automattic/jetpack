/**
 * External dependencies
 */
import {
	MetricTabsChart,
	MetricTabsChartSkeleton,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	defaultPeriodForInterval,
	type MetricTab,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { customer } from '@jetpack-premium-analytics/icons';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useSubscribersChart, {
	type SubscribersChartPoint,
	type SubscribersChartState,
	type SubscribersPeriod,
} from './use-subscribers-chart';
import {
	SUBSCRIBERS_CHART_METRICS,
	type SubscribersChartAttributes,
	type SubscribersChartMetricId,
	type SubscribersChartType,
} from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

type SubscribersChartRenderAttributes = SubscribersChartAttributes &
	Partial< ReportParamsFieldAttributes >;
type SubscribersChartWidgetProps = WidgetRenderProps< SubscribersChartRenderAttributes > & {
	/**
	 * Host callback to surface a widget error in the dashboard frame.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

const DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

// Ordered finest to coarsest, as `defaultPeriodForInterval` requires. Mirrors
// `getStatsPeriodFromInterval` + `toSubscribersUnit` in the data layer, narrowed
// to the dropdown's options.
const SUBSCRIBERS_PERIODS = [
	'day',
	'week',
	'month',
] as const satisfies readonly SubscribersPeriod[];

/**
 * The latest value of a metric in a window — each point is the cumulative count
 * as of that period, so the headline value is the last point, not a sum.
 */
function latest(
	points: SubscribersChartPoint[],
	accessor: ( point: SubscribersChartPoint ) => number
): number {
	return points.length ? accessor( points[ points.length - 1 ] ) : 0;
}

/**
 * Pulls each metric's value off a chart point. Ids and labels come from
 * `SUBSCRIBERS_CHART_METRICS` in `widget.ts`.
 */
const METRIC_ACCESSORS: Record<
	SubscribersChartMetricId,
	( point: SubscribersChartPoint ) => number
> = {
	subscribers: point => point.subscribers,
	paid: point => point.paid,
};

/**
 * Build the metric tabs from the fetched state, in canonical order, with Paid
 * subscribers only when the site has any. Each tab carries its headline total +
 * the previous-window total for the delta, and the per-period points for the
 * chart.
 */
function buildMetrics( state: SubscribersChartState ): MetricTab[] {
	return SUBSCRIBERS_CHART_METRICS.filter( ( { id } ) => id !== 'paid' || state.hasPaid ).map(
		( { id, label } ) => {
			const accessor = METRIC_ACCESSORS[ id ];
			return {
				key: id,
				label,
				value: latest( state.current, accessor ),
				previousValue: state.previous.length ? latest( state.previous, accessor ) : undefined,
				current: state.current.map( point => ( { date: point.date, value: accessor( point ) } ) ),
				previous: state.previous.length
					? state.previous.map( point => ( { date: point.date, value: accessor( point ) } ) )
					: undefined,
			};
		}
	);
}

type SubscribersChartInnerProps = {
	/**
	 * How to draw the selected metric. `MetricTabsChart` owns the default.
	 */
	chartType?: SubscribersChartType;
};

/**
 * The bucket size follows the dashboard's chart interval control, clamped to
 * what this chart supports. The "Chart type" control is the `chartType`
 * attribute (`relevance: 'high'`), rendered by the widget host. Which metric is
 * plotted is the chart's own tab selection.
 */
function SubscribersChartInner( { chartType }: SubscribersChartInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const period: SubscribersPeriod = defaultPeriodForInterval(
		reportParams.interval,
		SUBSCRIBERS_PERIODS
	);

	const state = useSubscribersChart( reportParams, period );
	const metricTabs = useMemo( () => buildMetrics( state ), [ state ] );
	const groupLabel = __( 'Subscriber metric', 'jetpack-premium-analytics-pkg' );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ state.isLoading }
				isFetching={ state.isFetching }
				// The query keeps prior data via `placeholderData`, so a transient
				// refetch failure keeps the chart visible; only surface the error
				// when there is nothing to show.
				isError={ state.current.length === 0 && state.isError }
				isEmpty={ state.current.length === 0 }
				error={ {
					description: __(
						"We couldn't load subscriber data. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [
						{ label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: state.refetch },
					],
				} }
				empty={ {
					icon: customer,
					description: __( 'No subscriber data in this period.', 'jetpack-premium-analytics-pkg' ),
				} }
				renderLoading={ <MetricTabsChartSkeleton /> }
			>
				<MetricTabsChart
					metrics={ metricTabs }
					dataFormat={ DATA_FORMAT }
					chartType={ chartType }
					groupLabel={ groupLabel }
					pointsAreWallClocks
				/>
			</WidgetState>
		</div>
	);
}

export default function SubscribersChart( {
	attributes = {},
	setError,
}: SubscribersChartWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<SubscribersChartInner chartType={ attributes.chartType } />
		</WidgetRoot>
	);
}
