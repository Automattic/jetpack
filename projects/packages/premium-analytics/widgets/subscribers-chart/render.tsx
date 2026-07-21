/**
 * External dependencies
 */
import {
	MetricTabsChart,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	ChartEmptyState,
	type MetricTab,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { customer } from '@jetpack-premium-analytics/icons';
import { useMemo } from '@wordpress/element';
import { trendingUp } from '@wordpress/icons';
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
	DEFAULT_SUBSCRIBERS_CHART_METRICS,
	SUBSCRIBERS_CHART_METRICS,
	type SubscribersChartAttributes,
	type SubscribersChartGranularity,
	type SubscribersChartMetricId,
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

/**
 * Default granularity for the dashboard interval: opens the dropdown at the
 * granularity the range implies (and, until the user picks one explicitly,
 * keeps following the range). The subscribers endpoint only buckets by
 * day/week/month, so finer/coarser dashboard intervals collapse onto those —
 * this mirrors `getStatsPeriodFromInterval` + `toSubscribersUnit` in the data
 * layer, narrowed to the dropdown's options.
 *
 * @param interval - The dashboard-derived interval.
 * @return The matching selectable granularity.
 */
function defaultPeriodForInterval( interval?: string ): SubscribersPeriod {
	switch ( interval ) {
		case 'week':
			return 'week';
		case 'month':
		case 'quarter':
		case 'year':
			return 'month';
		default:
			return 'day';
	}
}

/**
 * The latest value of a metric in a window — each point is the cumulative count
 * as of that period, so the headline value is the last point, not a sum.
 *
 * @param points   - Chart points, oldest first.
 * @param accessor - Pulls the metric value off a point.
 * @return The latest value, or 0 when the window is empty.
 */
function latest(
	points: SubscribersChartPoint[],
	accessor: ( point: SubscribersChartPoint ) => number
): number {
	return points.length ? accessor( points[ points.length - 1 ] ) : 0;
}

/**
 * Pulls each metric's value off a chart point. Ids and labels are shared with
 * the settings checkboxes via `SUBSCRIBERS_CHART_METRICS` in `widget.ts`.
 */
const METRIC_ACCESSORS: Record<
	SubscribersChartMetricId,
	( point: SubscribersChartPoint ) => number
> = {
	subscribers: point => point.subscribers,
	paid: point => point.paid,
};

/**
 * Build the metric tabs from the fetched state: the selected metrics, in
 * canonical order, with Paid subscribers only when the site has any. Each tab
 * carries its headline total + the previous-window total for the delta, and
 * the per-period points for the chart.
 *
 * @param state     - The fetched subscribers state.
 * @param metricIds - Selected metric tab ids.
 * @return The metric tabs.
 */
function buildMetrics(
	state: SubscribersChartState,
	metricIds: SubscribersChartMetricId[]
): MetricTab[] {
	const selected = new Set( metricIds );

	return SUBSCRIBERS_CHART_METRICS.filter(
		( { id } ) => selected.has( id ) && ( id !== 'paid' || state.hasPaid )
	).map( ( { id, label } ) => {
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
	} );
}

type SubscribersChartInnerProps = {
	/**
	 * Selected granularity; `auto` follows the dashboard range.
	 */
	granularity: SubscribersChartGranularity;
	/**
	 * Selected metric tab ids; defaults to every metric.
	 */
	metrics?: SubscribersChartMetricId[];
};

/**
 * Subscribers chart inner component. Reads the dashboard date range + comparison
 * state from `useWidgetRootContext()` and hands the selected metric tabs to the
 * shared `MetricTabsChart`. The "Group by" control is the `granularity`
 * attribute and the tab selection is the `metrics` attribute (both
 * `relevance: 'high'`), rendered by the widget host.
 *
 * @param {SubscribersChartInnerProps} props - The component props.
 * @return The widget body.
 */
function SubscribersChartInner( {
	granularity,
	metrics: metricIds = DEFAULT_SUBSCRIBERS_CHART_METRICS,
}: SubscribersChartInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	// `auto` means "follow the dashboard range"; an explicit value sticks
	// across range changes. This keeps a wide range from staying stuck on
	// `day` granularity (and blowing up the bucket count) while the user
	// hasn't picked a granularity themselves.
	const period: SubscribersPeriod =
		granularity === 'auto' ? defaultPeriodForInterval( reportParams.interval ) : granularity;

	const state = useSubscribersChart( reportParams, period );
	const metricTabs = useMemo( () => buildMetrics( state, metricIds ), [ state, metricIds ] );
	const groupLabel = __( 'Subscriber metric', 'jetpack-premium-analytics' );

	// An empty selection is a configuration state, not a data state: it stands
	// whatever the fetch is doing.
	if ( ! metricIds.length ) {
		return (
			<ChartEmptyState
				icon={ trendingUp }
				text={ __(
					'No metric selected. Please select a metric from the metrics list.',
					'jetpack-premium-analytics'
				) }
			/>
		);
	}

	// Metrics are selected but every tab was filtered out — today that means
	// Paid subscribers is the sole selection on a site with no paid subscribers
	// in the window. Wait out the first fetch before claiming so, and let a
	// failed fetch fall through to `WidgetState`'s error rather than reporting
	// the absence of paid subscribers we never managed to load.
	if ( ! metricTabs.length && ! state.isError ) {
		if ( state.isLoading ) {
			return null;
		}

		return (
			<ChartEmptyState
				icon={ trendingUp }
				text={ __( 'No paid subscribers in this date range.', 'jetpack-premium-analytics' ) }
			/>
		);
	}

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ state.isLoading }
				// `isFetching` is deliberately not passed: the chart renders its own
				// scoped overlay below, so WidgetState's full-widget one would double
				// up and cover the metric tabs.
				//
				// The query keeps prior data via `placeholderData`, so a transient
				// refetch failure keeps the chart visible; only surface the error
				// when there is nothing to show.
				isError={ state.current.length === 0 && state.isError }
				isEmpty={ state.current.length === 0 }
				error={ {
					description: __(
						"We couldn't load subscriber data. Please try again in a moment.",
						'jetpack-premium-analytics'
					),
					actions: [
						{ label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: state.refetch },
					],
				} }
				empty={ {
					icon: customer,
					description: __( 'No subscriber data in this period.', 'jetpack-premium-analytics' ),
				} }
				// First load keeps the widget's chart-shaped skeleton (the metric tabs
				// over the chart's own loading overlay) instead of the default overlay.
				renderLoading={
					<MetricTabsChart
						metrics={ metricTabs }
						dataFormat={ DATA_FORMAT }
						loading
						groupLabel={ groupLabel }
					/>
				}
			>
				{ /* Background refetches keep the overlay scoped to the chart area so
				     the metric tabs stay usable, matching the pre-WidgetState behavior. */ }
				<MetricTabsChart
					metrics={ metricTabs }
					dataFormat={ DATA_FORMAT }
					loading={ state.isFetching }
					groupLabel={ groupLabel }
				/>
			</WidgetState>
		</div>
	);
}

/**
 * Widget render entry point.
 *
 * `WidgetRoot` provides the analytics query client and resolves the dashboard's
 * `reportParams`; the inner component reads that range/comparison state. The
 * granularity is the `granularity` attribute (`relevance: 'high'`), exposed as
 * a control by the widget host.
 *
 * @param {SubscribersChartWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function SubscribersChart( {
	attributes = {},
	setError,
}: SubscribersChartWidgetProps ) {
	const granularity = attributes.granularity ?? 'auto';

	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<SubscribersChartInner granularity={ granularity } metrics={ attributes.metrics } />
		</WidgetRoot>
	);
}
