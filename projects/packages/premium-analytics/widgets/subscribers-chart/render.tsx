/**
 * External dependencies
 */
import {
	MetricTabsChart,
	WidgetRoot,
	useWidgetRootContext,
	type MetricTab,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { SelectControl } from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './subscribers-chart.module.css';
import useSubscribersChart, {
	type SubscribersChartPoint,
	type SubscribersChartState,
	type SubscribersPeriod,
} from './use-subscribers-chart';

type SubscribersChartRenderProps = {
	attributes?: Partial< ReportParamsFieldAttributes >;
};

const DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * Seed the granularity dropdown from the dashboard interval so it opens at the
 * granularity the range implies; the subscribers endpoint only buckets by
 * day/week/month, so finer/coarser dashboard intervals collapse onto those.
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
	const [ period, setPeriod ] = useState< SubscribersPeriod >( () =>
		defaultPeriodForInterval( reportParams.interval )
	);
	const handlePeriodChange = useCallback(
		( value: string ) => setPeriod( value as SubscribersPeriod ),
		[]
	);

	const periodOptions = [
		{ label: __( 'By days', 'jetpack-premium-analytics' ), value: 'day' },
		{ label: __( 'By weeks', 'jetpack-premium-analytics' ), value: 'week' },
		{ label: __( 'By months', 'jetpack-premium-analytics' ), value: 'month' },
	];

	const state = useSubscribersChart( reportParams, period );
	const metrics = useMemo( () => buildMetrics( state ), [ state ] );

	if ( state.isError ) {
		return (
			<div className={ styles.root }>
				<Text>{ __( 'Unable to load subscribers.', 'jetpack-premium-analytics' ) }</Text>
			</div>
		);
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
 * @param props            - Render props supplied by the widget host.
 * @param props.attributes - Widget attributes, carrying host-provided report params.
 * @return The rendered widget.
 */
export default function SubscribersChart( { attributes }: SubscribersChartRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } options={ { from: '/' } }>
			<SubscribersChartInner />
		</WidgetRoot>
	);
}
