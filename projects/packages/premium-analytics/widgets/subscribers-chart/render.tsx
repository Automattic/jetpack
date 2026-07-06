/**
 * External dependencies
 */
import {
	MetricTabsChart,
	WidgetRoot,
	useWidgetError,
	useWidgetRootContext,
	type MetricTab,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
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
import type { SubscribersChartAttributes, SubscribersChartGranularity } from './widget';
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
 * Build the metric tabs from the fetched state: always Subscribers, plus Paid
 * subscribers when the site has any. Each tab carries its headline total + the
 * previous-window total for the delta, and the per-period points for the chart.
 *
 * @param state - The fetched subscribers state.
 * @return The metric tabs.
 */
function buildMetrics( state: SubscribersChartState ): MetricTab[] {
	const defs: Array< {
		key: string;
		label: string;
		accessor: ( p: SubscribersChartPoint ) => number;
	} > = [
		{
			key: 'subscribers',
			label: __( 'Subscribers', 'jetpack-premium-analytics' ),
			accessor: point => point.subscribers,
		},
	];
	if ( state.hasPaid ) {
		defs.push( {
			key: 'paid',
			label: __( 'Paid subscribers', 'jetpack-premium-analytics' ),
			accessor: point => point.paid,
		} );
	}

	return defs.map( def => ( {
		key: def.key,
		label: def.label,
		value: latest( state.current, def.accessor ),
		previousValue: state.previous.length ? latest( state.previous, def.accessor ) : undefined,
		current: state.current.map( point => ( { date: point.date, value: def.accessor( point ) } ) ),
		previous: state.previous.length
			? state.previous.map( point => ( { date: point.date, value: def.accessor( point ) } ) )
			: undefined,
	} ) );
}

type SubscribersChartInnerProps = {
	/**
	 * Selected granularity; `auto` follows the dashboard range.
	 */
	granularity: SubscribersChartGranularity;
};

/**
 * Subscribers chart inner component. Reads the dashboard date range + comparison
 * state from `useWidgetRootContext()` and hands the metric tabs (Subscribers,
 * Paid subscribers) to the shared `MetricTabsChart`. The "Group by" control is
 * the `granularity` attribute (`relevance: 'high'`), rendered by the widget
 * host; it only chooses the bucket size within the dashboard range.
 *
 * @param {SubscribersChartInnerProps} props - The component props.
 * @return The widget body.
 */
function SubscribersChartInner( { granularity }: SubscribersChartInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	// `auto` means "follow the dashboard range"; an explicit value sticks
	// across range changes. This keeps a wide range from staying stuck on
	// `day` granularity (and blowing up the bucket count) while the user
	// hasn't picked a granularity themselves.
	const period: SubscribersPeriod =
		granularity === 'auto' ? defaultPeriodForInterval( reportParams.interval ) : granularity;

	const state = useSubscribersChart( reportParams, period );
	const metrics = useMemo( () => buildMetrics( state ), [ state ] );

	const hasError = useWidgetError( state.isError, state.error, state.refetch );
	if ( hasError ) {
		return null; // Dashboard shows error UI via WidgetErrorBoundary.
	}

	return (
		<div className={ styles.root }>
			<MetricTabsChart
				metrics={ metrics }
				dataFormat={ DATA_FORMAT }
				loading={ state.isFetching }
				groupLabel={ __( 'Subscriber metric', 'jetpack-premium-analytics' ) }
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
			<SubscribersChartInner granularity={ granularity } />
		</WidgetRoot>
	);
}
