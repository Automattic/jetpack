/**
 * External dependencies
 */
import {
	MetricTabsChart,
	WidgetRoot,
	type MetricTab,
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
import type { SubscribersChartAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

const DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

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
 * Subscribers chart inner component. Owns the granularity dropdown and hands the
 * metric tabs (Subscribers, Paid subscribers) to the shared `MetricTabsChart`.
 *
 * @return The widget body.
 */
function SubscribersChartInner() {
	const [ period, setPeriod ] = useState< SubscribersPeriod >( 'day' );
	const handlePeriodChange = useCallback(
		( value: string ) => setPeriod( value as SubscribersPeriod ),
		[]
	);

	const periodOptions = [
		{ label: __( 'By days', 'jetpack-premium-analytics' ), value: 'day' },
		{ label: __( 'By weeks', 'jetpack-premium-analytics' ), value: 'week' },
		{ label: __( 'By months', 'jetpack-premium-analytics' ), value: 'month' },
	];

	const state = useSubscribersChart( period );
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
 * Mirrors the other Stats widgets: `WidgetRoot` provides the analytics query
 * client, and the inner component owns the granularity state. The subscribers
 * query is granularity-driven rather than date-range-driven, so it does not
 * read the dashboard's `reportParams`.
 *
 * @param props            - Render props supplied by the widget host.
 * @param props.attributes - Widget attributes (none configurable yet).
 * @return The rendered widget.
 */
export default function SubscribersChart( {
	attributes = {},
}: WidgetRenderProps< SubscribersChartAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<SubscribersChartInner />
		</WidgetRoot>
	);
}
