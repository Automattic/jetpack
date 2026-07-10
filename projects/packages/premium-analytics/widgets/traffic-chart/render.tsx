/**
 * External dependencies
 */
import {
	MetricTabsChart,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { reports } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useTrafficChart, { type TrafficPeriod } from './use-traffic-chart';
import type { TrafficChartAttributes, TrafficChartGranularity } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type TrafficChartRenderAttributes = TrafficChartAttributes & Partial< ReportParamsFieldAttributes >;
type TrafficChartWidgetProps = WidgetRenderProps< TrafficChartRenderAttributes >;

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
};

/**
 * Traffic chart inner component. Reads the dashboard date range + comparison
 * state from `useWidgetRootContext()` and hands the per-metric tabs (Views,
 * Visitors, Likes, Comments) to the shared `MetricTabsChart`. The "Group by"
 * control is the `granularity` attribute (`relevance: 'high'`), rendered by
 * the widget host; it only chooses the bucket size within the dashboard range.
 *
 * @param {TrafficChartInnerProps} props - The component props.
 * @return The widget body.
 */
function TrafficChartInner( { granularity }: TrafficChartInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	// `auto` means "follow the dashboard range"; an explicit value sticks
	// across range changes, so a wide range doesn't stay stuck on `day`
	// granularity (and blow up the bucket count) while the user hasn't picked
	// a granularity themselves.
	const period: TrafficPeriod =
		granularity === 'auto' ? defaultPeriodForInterval( reportParams.interval ) : granularity;

	const { metrics, isLoading, isFetching, isError, refetch } = useTrafficChart(
		reportParams,
		period
	);
	const groupLabel = __( 'Traffic metric', 'jetpack-premium-analytics' );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isError={ isError }
				isEmpty={ metrics.every( metric => metric.current.length === 0 ) }
				error={ {
					description: __(
						"We couldn't load traffic data. Please try again in a moment.",
						'jetpack-premium-analytics'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
				} }
				empty={ {
					icon: reports,
					description: __( 'No traffic data in this period.', 'jetpack-premium-analytics' ),
				} }
				// First load keeps the widget's chart-shaped skeleton (the metric tabs
				// over the chart's own loading overlay) instead of the default overlay.
				renderLoading={
					<MetricTabsChart
						metrics={ metrics }
						dataFormat={ DATA_FORMAT }
						loading
						groupLabel={ groupLabel }
					/>
				}
			>
				{ /* Background refetches keep the overlay scoped to the chart area so
				     the metric tabs stay usable, matching the pre-WidgetState behavior. */ }
				<MetricTabsChart
					metrics={ metrics }
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
export default function TrafficChart( { attributes = {} }: TrafficChartWidgetProps ) {
	const granularity = attributes.granularity ?? 'auto';

	return (
		<WidgetRoot attributes={ attributes } options={ { from: '/' } }>
			<TrafficChartInner granularity={ granularity } />
		</WidgetRoot>
	);
}
