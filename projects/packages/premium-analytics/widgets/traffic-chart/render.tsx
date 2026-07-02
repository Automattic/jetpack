/**
 * External dependencies
 */
import {
	MetricTabsChart,
	WidgetRoot,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { SelectControl } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './traffic-chart.module.css';
import useTrafficChart, { type TrafficPeriod } from './use-traffic-chart';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

const DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

const PERIOD_OPTIONS = [
	{ label: __( 'Days', 'jetpack-premium-analytics' ), value: 'day' },
	{ label: __( 'Weeks', 'jetpack-premium-analytics' ), value: 'week' },
	{ label: __( 'Months', 'jetpack-premium-analytics' ), value: 'month' },
];

/**
 * Default granularity for the dashboard interval: opens the dropdown at the
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

/**
 * Traffic chart inner component. Reads the dashboard date range + comparison
 * state from `useWidgetRootContext()`, owns the granularity dropdown (which only
 * chooses the bucket size within that range), and hands the per-metric tabs
 * (Views, Visitors, Likes, Comments) to the shared `MetricTabsChart`.
 *
 * @return The widget body.
 */
function TrafficChartInner() {
	const { reportParams } = useWidgetRootContext();
	// `null` means "follow the dashboard range"; a value is an explicit user
	// override that then sticks across range changes, so a wide range doesn't
	// stay stuck on `day` granularity (and blow up the bucket count) while the
	// user hasn't picked a granularity themselves.
	const [ periodOverride, setPeriodOverride ] = useState< TrafficPeriod | null >( null );
	const period = periodOverride ?? defaultPeriodForInterval( reportParams.interval );
	const handlePeriodChange = useCallback(
		( value: string ) => setPeriodOverride( value as TrafficPeriod ),
		[]
	);

	const { metrics, isFetching, isError } = useTrafficChart( reportParams, period );

	if ( isError ) {
		return (
			<div className={ styles.root }>
				<Text>{ __( 'Unable to load traffic.', 'jetpack-premium-analytics' ) }</Text>
			</div>
		);
	}

	return (
		<div className={ styles.root }>
			<MetricTabsChart
				metrics={ metrics }
				dataFormat={ DATA_FORMAT }
				loading={ isFetching }
				groupLabel={ __( 'Traffic metric', 'jetpack-premium-analytics' ) }
				controls={
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Group by', 'jetpack-premium-analytics' ) }
						hideLabelFromVision
						value={ period }
						options={ PERIOD_OPTIONS }
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
 * report params (date range + comparison); the inner component reads them from
 * context and fetches the traffic series.
 *
 * @param props            - Render props supplied by the widget host.
 * @param props.attributes - Widget attributes; the date range/comparison arrive here from the host.
 * @return The rendered widget.
 */
export default function TrafficChart( {
	attributes = {},
}: WidgetRenderProps< Partial< ReportParamsFieldAttributes > > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<TrafficChartInner />
		</WidgetRoot>
	);
}
