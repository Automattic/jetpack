/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	STATS_DEVICES_PERIODS,
	chartInterval,
	useScopeLockedIntervals,
} from '@jetpack-premium-analytics/data';
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
	metricTabsToCsv,
	WidgetRoot,
	useReportActions,
	useWidgetRootContext,
	type ComparativeBarChartSeries,
	type CsvColumn,
	type DonutSegmentInput,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useNoViewsEmptyState } from '../use-no-views-empty-state';
import { usePreviousPeriodShown } from '../use-previous-period-shown';
import useDeviceViews, { type DeviceView } from './use-device-views';
import useDeviceViewsOverTime from './use-device-views-over-time';
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

const RETRY_DESCRIPTION = () =>
	__(
		"We couldn't load device data. Please try again in a moment.",
		'jetpack-premium-analytics-pkg'
	);

const DEVICE_COLUMNS: CsvColumn< DeviceView >[] = [
	{
		label: __( 'Screen size', 'jetpack-premium-analytics-pkg' ),
		getValue: row => row.displayLabel,
	},
	{ label: __( 'Share (%)', 'jetpack-premium-analytics-pkg' ), getValue: row => row.percentage },
];

function toRatio( percentage: number ) {
	return percentage / 100;
}

function DevicesInner() {
	const { reportParams } = useWidgetRootContext();
	const {
		data,
		hasComparison,
		isLoading,
		isFetching,
		isError,
		csvIsError,
		csvIsPlaceholderData,
		error,
		refetch,
	} = useDeviceViews( {
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
	const isEmpty = segments.every( segment => ! segment.value );
	const emptyState = useNoViewsEmptyState( { isLoading, isError, isEmpty }, NO_VIEWS() );

	useReportActions( {
		csv: {
			rows: isEmpty ? [] : data,
			columns: DEVICE_COLUMNS,
			filenamePrefix: 'devices',
			hasDateRange: true,
			status: {
				isLoading,
				isError: csvIsError,
				isPlaceholderData: csvIsPlaceholderData,
			},
		},
	} );

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
			error={ describeError( error, { retryDescription: RETRY_DESCRIPTION(), onRetry: refetch } ) }
			empty={ emptyState.empty }
			format={ PERCENTAGE_DATA_FORMAT }
			variant="half-ring"
			withTotal={ false }
		/>
	);
}

/**
 * Views by screen size in each bucket of the range, stacked; the legend can add the previous period's total beside each stack.
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
	const period = chartInterval(
		{ ...reportParams, interval },
		STATS_DEVICES_PERIODS,
		lockedIntervals
	);
	const {
		devices,
		isLoading,
		isFetching,
		isError,
		error,
		csvIsError,
		csvIsPlaceholderData,
		timezone,
		refetch,
	} = useDeviceViewsOverTime( reportParams, period );

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

	// Like the semi-circle's, the file holds the current period only.
	const csv = useMemo(
		() =>
			devices.some( device => device.value )
				? metricTabsToCsv( devices, {
						zone: timezone,
						withTime: false,
						dateLabel: __( 'Date', 'jetpack-premium-analytics-pkg' ),
					} )
				: undefined,
		[ devices, timezone ]
	);
	useReportActions( {
		csv: csv && {
			...csv,
			filenamePrefix: 'devices-over-time',
			hasDateRange: true,
			status: {
				isLoading,
				isFetching,
				isError: csvIsError,
				isPlaceholderData: csvIsPlaceholderData,
			},
		},
	} );

	return (
		<WidgetState
			isLoading={ emptyState.isLoading }
			isFetching={ isFetching }
			isError={ isError }
			error={ describeError( error, { retryDescription: RETRY_DESCRIPTION(), onRetry: refetch } ) }
			isEmpty={ isEmpty }
			empty={ emptyState.empty }
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
