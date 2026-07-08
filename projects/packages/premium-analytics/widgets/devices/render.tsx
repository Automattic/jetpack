/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import {
	Legend,
	SemiCircleChart,
	WidgetLoadingOverlay,
	WidgetRoot,
	useSegmentStyles,
	useWidgetRootContext,
	type LegendItem,
	type ReportParamsFieldAttributes,
	type SemiCircleChartData,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useDeviceViews from './use-device-views';
import { type DevicesAttributes } from './widget';
/**
 * Types
 */
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type DevicesRenderAttributes = DevicesAttributes & Partial< ReportParamsFieldAttributes >;
type DevicesWidgetProps = WidgetRenderProps< DevicesRenderAttributes >;

const PERCENTAGE_DATA_FORMAT = {
	type: 'percentage' as const,
	options: { decimals: 1, signDisplay: 'auto' as const },
};

function toRatio( percentage: number ) {
	return percentage / 100;
}

type DevicesInnerProps = {
	/**
	 * Max rows to display.
	 */
	max: number;
};

/**
 * Inner component — rendered inside WidgetRoot.
 *
 * @param {DevicesInnerProps} props - The component props.
 * @return The rendered semi-circle chart or state placeholder.
 */
function DevicesInner( { max }: DevicesInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const { data, comparisonData, hasComparison, isLoading, isError, errorReason } = useDeviceViews( {
		reportParams,
		max,
		deviceProperty: 'screensize',
	} );

	const chartData: SemiCircleChartData = data.map( item => ( {
		label: item.displayLabel,
		value: toRatio( item.percentage ),
	} ) );

	// Must be called unconditionally before any early return.
	const segmentStyles = useSegmentStyles( chartData );

	if ( isError ) {
		return (
			<div className={ styles.content }>
				<Stack align="center" justify="center" className={ styles.placeholder }>
					<Text>
						{ errorReason === 'upgrade-required'
							? __(
									'Device stats are not included in your current plan.',
									'jetpack-premium-analytics'
							  )
							: __( 'Could not load device data.', 'jetpack-premium-analytics' ) }
					</Text>
				</Stack>
			</div>
		);
	}

	if ( isLoading && data.length === 0 ) {
		return (
			<div className={ styles.content }>
				<WidgetLoadingOverlay />
			</div>
		);
	}

	if ( data.length === 0 ) {
		return (
			<div className={ styles.content }>
				<Stack align="center" justify="center" className={ styles.placeholder }>
					<Text>{ __( 'No device data in this period.', 'jetpack-premium-analytics' ) }</Text>
				</Stack>
			</div>
		);
	}

	const comparisonMap = new Map(
		comparisonData.map( item => [ item.label, toRatio( item.percentage ) ] )
	);

	const legendData: LegendItem[] = data.map( item => ( {
		label: item.displayLabel,
		value: toRatio( item.percentage ),
		displayValue: formatMetricValue(
			toRatio( item.percentage ),
			PERCENTAGE_DATA_FORMAT.type,
			PERCENTAGE_DATA_FORMAT.options
		),
		comparison: hasComparison ? comparisonMap.get( item.label ) ?? 0 : undefined,
	} ) );
	const styledLegendData = legendData.map( ( item, index ) => ( {
		...item,
		color: segmentStyles[ index ]?.color,
	} ) );

	return (
		<div className={ styles.content }>
			<div className={ styles.chartShell }>
				<SemiCircleChart
					chartData={ chartData }
					styles={ segmentStyles }
					showLegend={ false }
					showMetric={ false }
					dataFormat={ PERCENTAGE_DATA_FORMAT }
				/>
				<Legend items={ styledLegendData } withComparison={ hasComparison } />
			</div>
		</div>
	);
}

/**
 * Devices widget render component.
 *
 * Shows screen size breakdown (Desktop / Mobile / Tablet) as a semi-circle chart.
 *
 * @param {DevicesWidgetProps} props - The widget render props.
 * @return The rendered widget content.
 */
export default function DevicesWidget( { attributes = {} }: DevicesWidgetProps ) {
	const max = attributes?.max ?? 5;

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<DevicesInner max={ max } />
			</div>
		</WidgetRoot>
	);
}
