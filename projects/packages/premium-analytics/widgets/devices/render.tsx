/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { device } from '@jetpack-premium-analytics/icons';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Legend,
	SemiCircleChart,
	WidgetRoot,
	WidgetState,
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
 * @return The rendered widget content.
 */
function DevicesInner( { max }: DevicesInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const { data, hasComparison, isLoading, isFetching, isError, errorReason, refetch } =
		useDeviceViews( {
			reportParams,
			max,
			deviceProperty: 'screensize',
		} );

	const chartData: SemiCircleChartData = data.map( item => ( {
		label: item.displayLabel,
		value: toRatio( item.percentage ),
	} ) );

	const segmentStyles = useSegmentStyles( chartData );

	const legendData: LegendItem[] = data.map( item => ( {
		label: item.displayLabel,
		value: toRatio( item.percentage ),
		displayValue: formatMetricValue(
			toRatio( item.percentage ),
			PERCENTAGE_DATA_FORMAT.type,
			PERCENTAGE_DATA_FORMAT.options
		),
		comparison:
			hasComparison && item.previousPercentage !== undefined
				? toRatio( item.previousPercentage )
				: undefined,
	} ) );
	const styledLegendData = legendData.map( ( item, index ) => ( {
		...item,
		color: segmentStyles[ index ]?.color,
	} ) );

	// A plan error can't be fixed by retrying, so the Retry action is only
	// offered for regular fetch failures.
	const isPlanError = errorReason === 'upgrade-required';

	return (
		<div className={ styles.content }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				isError={ isError }
				isEmpty={ data.length === 0 }
				error={ {
					description: isPlanError
						? __(
								'Device stats are not included in your current plan.',
								'jetpack-premium-analytics'
						  )
						: __(
								"We couldn't load device data. Please try again in a moment.",
								'jetpack-premium-analytics'
						  ),
					actions: isPlanError
						? undefined
						: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
				} }
				empty={ {
					icon: device,
					description: __( 'No device data in this period.', 'jetpack-premium-analytics' ),
				} }
			>
				<div className={ styles.chartWrap }>
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
			</WidgetState>
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
