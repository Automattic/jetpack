/**
 * External dependencies
 */
import {
	ComparativeLineChart,
	MetricWithComparison,
	WidgetLoadingOverlay,
	WidgetRoot,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { SelectControl } from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './subscribers-chart.module.css';
import useSubscribersChart, {
	type SubscribersChartState,
	type SubscribersPeriod,
} from './use-subscribers-chart';
import type { SubscribersChartAttributes } from './widget';
import type { ComponentProps } from 'react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type ChartSeries = ComponentProps< typeof ComparativeLineChart >[ 'series' ];

const DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * Label a previous-period series, e.g. "Subscribers (previous period)".
 *
 * @param metricLabel - The current-period metric label.
 * @return The previous-period label.
 */
function previousPeriodLabel( metricLabel: string ): string {
	return sprintf(
		/* translators: %s is a metric name, e.g. "Subscribers". */
		__( '%s (previous period)', 'jetpack-premium-analytics' ),
		metricLabel
	);
}

/**
 * Build the chart series from the fetched state.
 *
 * Each metric (all subscribers, paid subscribers) is a current line plus, when
 * available, a previous-period line in the same `group` — the chart gives
 * grouped series the same colour and renders `type: 'comparison'` series dashed,
 * so the previous period overlays as a same-colour dashed line. A transparent
 * gradient keeps those overlays fill-free while the current lines keep the area
 * fill.
 *
 * @param state - The fetched subscribers state.
 * @return The chart series.
 */
function buildChartSeries( state: SubscribersChartState ): ChartSeries {
	const subscribersLabel = __( 'Subscribers', 'jetpack-premium-analytics' );
	const paidLabel = __( 'Paid subscribers', 'jetpack-premium-analytics' );

	// Mark the previous-period series as a comparison (dashed) and drop its area
	// fill so only the current lines carry a gradient.
	const previousOptions = {
		type: 'comparison' as const,
		gradient: { from: 'transparent', to: 'transparent', fromOpacity: 0, toOpacity: 0 },
	};

	const series: ChartSeries = [];

	series.push( {
		label: subscribersLabel,
		group: 'subscribers',
		data: state.current.map( point => ( { date: point.date, value: point.subscribers } ) ),
	} );

	if ( state.hasPaid ) {
		series.push( {
			label: paidLabel,
			group: 'paid',
			data: state.current.map( point => ( { date: point.date, value: point.paid } ) ),
		} );
	}

	if ( state.previous.length ) {
		series.push( {
			label: previousPeriodLabel( subscribersLabel ),
			group: 'subscribers',
			data: state.previous.map( point => ( { date: point.date, value: point.subscribers } ) ),
			options: previousOptions,
		} );

		if ( state.hasPaid ) {
			series.push( {
				label: previousPeriodLabel( paidLabel ),
				group: 'paid',
				data: state.previous.map( point => ( { date: point.date, value: point.paid } ) ),
				options: previousOptions,
			} );
		}
	}

	return series;
}

/**
 * Subscribers chart inner component. Owns the granularity selection and renders
 * the headline total, period-over-period delta, and the comparative line chart.
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

	const series = useMemo( () => buildChartSeries( state ), [ state ] );

	const isInitialLoading = state.isLoading && state.current.length === 0;
	// Only show a delta when there is a real previous period to compare against.
	const previousValue = state.previous.length ? state.previousTotal : undefined;

	return (
		<div className={ styles.root }>
			<Stack direction="row" justify="space-between" align="flex-start" className={ styles.header }>
				{ state.isError ? (
					<Text>{ __( 'Unable to load subscribers.', 'jetpack-premium-analytics' ) }</Text>
				) : (
					<MetricWithComparison
						value={ state.currentTotal }
						previousValue={ previousValue }
						dataFormat={ DATA_FORMAT }
						direction="row"
						align="flex-end"
					/>
				) }
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
			</Stack>
			{ ! state.isError && (
				<div className={ styles.chart }>
					<ComparativeLineChart series={ series } dataFormat={ DATA_FORMAT } />
					{ isInitialLoading && <WidgetLoadingOverlay /> }
				</div>
			) }
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
