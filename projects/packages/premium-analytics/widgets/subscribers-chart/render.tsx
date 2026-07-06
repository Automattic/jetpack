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
import { SelectControl } from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';
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
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// The widget has no own attributes; report params arrive from the host (or
// WidgetRoot's URL fallback), so the render shape is host fields only.
type SubscribersChartWidgetProps = WidgetRenderProps< Partial< ReportParamsFieldAttributes > > & {
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

/**
 * Subscribers chart inner component. Reads the dashboard date range + comparison
 * state from `useWidgetRootContext()`, owns the granularity dropdown (which only
 * chooses the bucket size within that range), and hands the metric tabs
 * (Subscribers, Paid subscribers) to the shared `MetricTabsChart`.
 *
 * @return The widget body.
 */
function SubscribersChartInner() {
	const { reportParams } = useWidgetRootContext();
	// `null` means "follow the dashboard range"; a value is an explicit user
	// override that then sticks across range changes. This keeps a wide range
	// from staying stuck on `day` granularity (and blowing up the bucket count)
	// while the user hasn't picked a granularity themselves.
	const [ periodOverride, setPeriodOverride ] = useState< SubscribersPeriod | null >( null );
	const period = periodOverride ?? defaultPeriodForInterval( reportParams.interval );
	const handlePeriodChange = useCallback(
		( value: string ) => setPeriodOverride( value as SubscribersPeriod ),
		[]
	);

	const periodOptions = [
		{ label: __( 'By days', 'jetpack-premium-analytics' ), value: 'day' },
		{ label: __( 'By weeks', 'jetpack-premium-analytics' ), value: 'week' },
		{ label: __( 'By months', 'jetpack-premium-analytics' ), value: 'month' },
	];

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
				controls={
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Group by', 'jetpack-premium-analytics' ) }
						hideLabelFromVision
						value={ period }
						options={ periodOptions }
						onChange={ handlePeriodChange }
						className={ styles.periodSelect }
					/>
				}
			/>
		</div>
	);
}

/**
 * Widget render entry point.
 *
 * `WidgetRoot` provides the analytics query client and resolves the dashboard's
 * `reportParams`; the inner component reads that range/comparison state and
 * layers its own granularity control on top.
 *
 * @param {SubscribersChartWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function SubscribersChart( { attributes, setError }: SubscribersChartWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<SubscribersChartInner />
		</WidgetRoot>
	);
}
