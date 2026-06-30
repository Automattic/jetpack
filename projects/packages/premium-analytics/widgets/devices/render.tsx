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
import type { DevicesAttributes } from './widget';
/**
 * Types
 */
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type DevicesRenderAttributes = DevicesAttributes & Partial< ReportParamsFieldAttributes >;
type DevicesWidgetProps = WidgetRenderProps< DevicesRenderAttributes > & {
	showTitle?: boolean;
};

const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

/**
 * Inner component — rendered inside WidgetRoot.
 *
 * @param props           - Props.
 * @param props.max       - Max rows to display.
 * @param props.showTitle - Whether to render the widget title inside the render module.
 * @return The rendered semi-circle chart or state placeholder.
 */
function DevicesInner( { max, showTitle }: { max: number; showTitle: boolean } ) {
	const { reportParams } = useWidgetRootContext();
	const { data, comparisonData, hasComparison, isLoading, isError, errorReason } = useDeviceViews( {
		reportParams,
		max,
		deviceProperty: 'screensize',
	} );

	const chartData: SemiCircleChartData = data.map( item => ( {
		label: item.displayLabel,
		value: item.views,
	} ) );

	// Must be called unconditionally before any early return.
	const segmentStyles = useSegmentStyles( chartData );

	const header = showTitle ? (
		<Stack direction="row" justify="space-between" align="center" className={ styles.widgetHeader }>
			<Text variant="heading-md" render={ <h3 /> }>
				{ __( 'Devices', 'jetpack-premium-analytics' ) }
			</Text>
		</Stack>
	) : null;

	if ( isError ) {
		return (
			<>
				{ header }
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
			</>
		);
	}

	if ( isLoading && data.length === 0 ) {
		return (
			<>
				{ header }
				<div className={ styles.content }>
					<WidgetLoadingOverlay />
				</div>
			</>
		);
	}

	if ( data.length === 0 ) {
		return (
			<>
				{ header }
				<div className={ styles.content }>
					<Stack align="center" justify="center" className={ styles.placeholder }>
						<Text>{ __( 'No device data in this period.', 'jetpack-premium-analytics' ) }</Text>
					</Stack>
				</div>
			</>
		);
	}

	const total = data.reduce( ( sum, item ) => sum + item.views, 0 );
	const comparisonTotal = comparisonData.reduce( ( sum, item ) => sum + item.views, 0 );
	const comparisonMap = new Map( comparisonData.map( item => [ item.label, item.views ] ) );

	const legendData: LegendItem[] = data.map( item => ( {
		label: item.displayLabel,
		value: item.views,
		displayValue: formatMetricValue( item.views, DATA_FORMAT.type, DATA_FORMAT.options ),
		comparison: hasComparison ? comparisonMap.get( item.label ) ?? 0 : undefined,
	} ) );

	return (
		<>
			{ header }
			<div className={ styles.content }>
				<SemiCircleChart
					chartData={ chartData }
					value={ total }
					comparisonValue={ hasComparison ? comparisonTotal : null }
					styles={ segmentStyles }
					legendData={ legendData }
					showLegend
					dataFormat={ DATA_FORMAT }
				/>
			</div>
		</>
	);
}

/**
 * Devices widget render component.
 *
 * Shows screen size breakdown (Desktop / Mobile / Tablet) as a semi-circle chart.
 *
 * @param props            - Render props.
 * @param props.attributes - Widget attributes (max).
 * @param props.showTitle  - Whether to render the widget title inside the render module.
 * @return The rendered widget content.
 */
export default function DevicesWidget( { attributes = {}, showTitle = true }: DevicesWidgetProps ) {
	const max = attributes?.max ?? 5;

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<DevicesInner max={ max } showTitle={ showTitle } />
			</div>
		</WidgetRoot>
	);
}
