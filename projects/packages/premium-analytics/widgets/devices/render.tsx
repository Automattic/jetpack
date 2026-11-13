/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartInterval, useScopeLockedIntervals } from '@jetpack-premium-analytics/data';
import {
	BarChartSkeleton,
	ComparativeBarChart,
	Donut,
	HEADLINE_COUNT_FORMAT,
	WIDGET_ROW_LIMIT,
	WidgetState,
	describeError,
	formatComparisonSeriesLabel,
	getComparisonPeriodLabel,
	WidgetRoot,
	useWidgetRootContext,
	type ComparativeBarChartSeries,
	type DonutSegmentInput,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useNoViewsEmptyState } from '../use-no-views-empty-state';
import { usePreviousPeriodShown } from '../use-previous-period-shown';
import useDeviceViews from './use-device-views';
import useDeviceViewsOverTime from './use-device-views-over-time';
import { DEVICES_PERIODS } from './widget';
import type { DevicesAttributes, DevicesChartGranularity } from './widget';
/**
 * Types
 */
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

export type { DevicesAttributes } from './widget';

type DevicesRenderAttributes = DevicesAttributes & Partial< ReportParamsFieldAttributes >;
type DevicesWidgetProps = WidgetRenderProps< DevicesRenderAttributes >;

const PERCENTAGE_DATA_FORMAT = {
	type: 'percentage' as const,
	options: { decimals: 1, signDisplay: 'auto' as const },
};

const NO_VIEWS = () =>
	__( 'You don’t have devices recorded yet.', 'jetpack-premium-analytics-pkg' );

function toRatio( percentage: number ) {
	return percentage / 100;
}

function DevicesInner() {
	const { reportParams } = useWidgetRootContext();
	const { data, hasComparison, isLoading, isFetching, isError, error, refetch } = useDeviceViews( {
		reportParams,
		max: WIDGET_ROW_LIMIT,
		deviceProperty: 'screensize',
	} );

	const segments = useMemo< DonutSegmentInput[] >(
		() =>
			data.map( item => ( {
				label: item.displayLabel,
				value: toRatio( item.percentage ),
				previousValue:
					item.previousPercentage === undefined ? undefined : toRatio( item.previousPercentage ),
			} ) ),
		[ data ]
	);
	const emptyState = useNoViewsEmptyState(
		{ isLoading, isError, isEmpty: segments.every( segment => ! segment.value ) },
		NO_VIEWS()
	);

	return (
		<Donut
			segments={ segments }
			status={ {
				isLoading: emptyState.isLoading,
				isFetching,
				isError,
				hasComparison,
				refetch,
			} }
			error={ describeError( error, {
				retryDescription: __(
					"We couldn't load device data. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				onRetry: refetch,
			} ) }
			empty={ emptyState.empty }
			format={ PERCENTAGE_DATA_FORMAT }
			variant="half-ring"
			withTotal={ false }
		/>
	);
}

/**
 * Views by screen size in each bucket of the range, stacked, with the previous period's total beside each stack.
 *
 * @param props          - Component props.
 * @param props.interval - The saved bucket size, if any.
 * @return The chart.
 */
function DevicesBarChart( { interval }: { interval?: DevicesChartGranularity } ) {
	const { reportParams } = useWidgetRootContext();
	const lockedIntervals = useScopeLockedIntervals();
	const [ previousPeriodShown, setPreviousPeriodShown ] = usePreviousPeriodShown(
		'devicesChartPreviousPeriod'
	);
	const period = chartInterval( { ...reportParams, interval }, DEVICES_PERIODS, lockedIntervals );
	const { devices, isLoading, isFetching, isError, refetch } = useDeviceViewsOverTime(
		reportParams,
		period
	);

	const series = useMemo< ComparativeBarChartSeries[] >(
		() =>
			devices.flatMap( device => [
				{ label: device.label, group: device.key, data: device.current },
				...( device.previous?.length
					? [
							{
								label: formatComparisonSeriesLabel( device.label ),
								group: device.key,
								data: device.previous,
								...( device.previousAligned ? { aligned: true } : {} ),
								options: { type: 'comparison' as const },
							},
						]
					: [] ),
			] ),
		[ devices ]
	);
	const isEmpty = devices.every( device => ! device.value && ! device.previousValue );
	const emptyState = useNoViewsEmptyState( { isLoading, isError, isEmpty }, NO_VIEWS() );

	return (
		<WidgetState
			isLoading={ emptyState.isLoading }
			isFetching={ isFetching }
			isError={ isError }
			error={ {
				description: __(
					"We couldn't load device data. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
			} }
			isEmpty={ isEmpty }
			empty={
				emptyState.empty ?? {
					description: __( 'No device views in this period.', 'jetpack-premium-analytics-pkg' ),
				}
			}
			renderLoading={ <BarChartSkeleton /> }
		>
			<ComparativeBarChart
				series={ series }
				layout="stacked"
				dataFormat={ HEADLINE_COUNT_FORMAT }
				tickResolution={ period }
				comparisonLabel={ getComparisonPeriodLabel( reportParams ) }
				legendInteractive
				previousPeriodShown={ previousPeriodShown }
				onPreviousPeriodShownChange={ setPreviousPeriodShown }
			/>
		</WidgetState>
	);
}

/**
 * Shows screen size breakdown (Desktop / Mobile / Tablet) as a semi-circle chart, or as stacked bars over time.
 */
export default function DevicesWidget( { attributes = {} }: DevicesWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			{ attributes.chartType === 'bar' ? (
				<DevicesBarChart interval={ attributes.chartInterval } />
			) : (
				<DevicesInner />
			) }
		</WidgetRoot>
	);
}
