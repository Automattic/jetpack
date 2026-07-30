/**
 * External dependencies
 */
import {
	MetricTabsChart,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	defaultPeriodForInterval,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { reports } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useTrafficChart, { type TrafficPeriod } from './use-traffic-chart';
import type {
	TrafficChartAttributes,
	TrafficChartGranularity,
	TrafficChartMetricId,
} from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

type TrafficChartRenderAttributes = TrafficChartAttributes & Partial< ReportParamsFieldAttributes >;
type TrafficChartWidgetProps = WidgetRenderProps< TrafficChartRenderAttributes > & {
	/**
	 * Host callback to surface a widget error in the dashboard frame.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

const DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

// Ordered finest to coarsest, as `defaultPeriodForInterval` requires.
const TRAFFIC_PERIODS = [ 'day', 'week', 'month' ] as const satisfies readonly TrafficPeriod[];

/**
 * Resolves Auto down to hourly for narrow dashboard ranges. The shared
 * `defaultPeriodForInterval` helper's mapping table has no `hour` entry —
 * adding one there would flip its "unsupported" fallback toward the coarsest
 * end for every other widget that doesn't offer hourly (the helper's clamp
 * only handles "too coarse", not "too fine") — so hourly is resolved locally
 * before deferring to the shared helper for everything else.
 *
 * @param interval - The dashboard-derived interval.
 * @return The matching selectable granularity.
 */
function resolveAutoPeriod( interval?: string ): TrafficPeriod {
	return interval === 'hour' ? 'hour' : defaultPeriodForInterval( interval, TRAFFIC_PERIODS );
}

type TrafficChartInnerProps = {
	/**
	 * Selected granularity; `auto` follows the dashboard range.
	 */
	granularity: TrafficChartGranularity;
	/**
	 * Selected metric tab ids; defaults to every metric.
	 */
	metrics?: TrafficChartMetricId[];
};

/**
 * Traffic chart inner component. Reads the dashboard date range + comparison
 * state from `useWidgetRootContext()` and hands the selected metric tabs to the
 * shared `MetricTabsChart`. The "Group by" control is the `granularity`
 * attribute and the tab selection is the `metrics` attribute (both
 * `relevance: 'high'`), rendered by the widget host.
 *
 * @param {TrafficChartInnerProps} props - The component props.
 * @return The widget body.
 */
function TrafficChartInner( { granularity, metrics }: TrafficChartInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	// `auto` means "follow the dashboard range"; an explicit value sticks
	// across range changes, so a wide range doesn't stay stuck on `day`
	// granularity (and blow up the bucket count) while the user hasn't picked
	// a granularity themselves.
	const period: TrafficPeriod =
		granularity === 'auto' ? resolveAutoPeriod( reportParams.interval ) : granularity;

	const {
		metrics: metricTabs,
		isLoading,
		isFetching,
		isError,
		refetch,
	} = useTrafficChart( reportParams, period, metrics );
	const groupLabel = __( 'Traffic metric', 'jetpack-premium-analytics-pkg' );

	if ( ! metricTabs.length ) {
		return (
			<div className={ styles.emptyState }>
				{ __(
					'No metric selected. Please select a metric from the metrics list.',
					'jetpack-premium-analytics-pkg'
				) }
			</div>
		);
	}

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				// `isFetching` is deliberately not passed: the chart renders its own
				// scoped overlay below, so WidgetState's full-widget one would double
				// up and cover the metric tabs.
				//
				// `useTrafficChart` already gates `isError` per query on that query
				// having no rows, so a transient refetch failure keeps the chart.
				isError={ isError }
				isEmpty={ metricTabs.every( metric => metric.current.length === 0 ) }
				error={ {
					description: __(
						"We couldn't load traffic data. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				empty={ {
					icon: reports,
					description: __( 'No traffic data in this period.', 'jetpack-premium-analytics-pkg' ),
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
					loading={ isFetching }
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
 * @param {TrafficChartWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function TrafficChart( { attributes = {}, setError }: TrafficChartWidgetProps ) {
	const granularity = attributes.granularity ?? 'auto';

	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<TrafficChartInner granularity={ granularity } metrics={ attributes.metrics } />
		</WidgetRoot>
	);
}
