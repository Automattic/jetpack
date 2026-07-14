/**
 * External dependencies
 */
import {
	MetricTabsChart,
	WidgetRoot,
	useWidgetError,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
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

/**
 * Default granularity for the dashboard interval: opens the control at the
 * granularity the range implies (and, until the user picks one explicitly,
 * keeps following the range). The dropdown only offers day/week/month, so
 * finer/coarser dashboard intervals collapse onto those.
 *
 * @param interval - The dashboard-derived interval.
 * @return The matching selectable granularity.
 */
function defaultPeriodForInterval( interval?: string ): TrafficPeriod {
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
		granularity === 'auto' ? defaultPeriodForInterval( reportParams.interval ) : granularity;

	const {
		metrics: metricTabs,
		isFetching,
		isError,
		error,
		refetch,
	} = useTrafficChart( reportParams, period, metrics );

	const hasError = useWidgetError( isError, error, refetch );
	if ( hasError ) {
		return null; // Dashboard shows error UI via WidgetErrorBoundary.
	}

	if ( ! metricTabs.length ) {
		return (
			<div className={ styles.emptyState }>
				{ __(
					'No metric selected. Please select a metric from the metrics list.',
					'jetpack-premium-analytics'
				) }
			</div>
		);
	}

	return (
		<div className={ styles.root }>
			<MetricTabsChart
				metrics={ metricTabs }
				dataFormat={ DATA_FORMAT }
				loading={ isFetching }
				groupLabel={ __( 'Traffic metric', 'jetpack-premium-analytics' ) }
			/>
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
