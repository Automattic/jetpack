/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
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
import type { StatsDeviceProperty } from '@jetpack-premium-analytics/data';

type DevicesRenderProps = {
	attributes?: Partial< ReportParamsFieldAttributes > & {
		max?: number;
	};
};

const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

const DEVICE_OPTIONS: { label: string; value: StatsDeviceProperty }[] = [
	{ label: __( 'Screen size', 'jetpack-premium-analytics' ), value: 'screensize' },
	{ label: __( 'Browser', 'jetpack-premium-analytics' ), value: 'browser' },
	{ label: __( 'OS', 'jetpack-premium-analytics' ), value: 'platform' },
];

/**
 * Inner component — rendered inside WidgetRoot so useWidgetRootContext
 * and useStatsDevices (TanStack Query) both have their required providers.
 *
 * @param root0     - Props.
 * @param root0.max - Max rows to display.
 * @return The rendered semi-circle chart or state placeholder.
 */
function DevicesInner( { max }: { max: number } ) {
	const { reportParams } = useWidgetRootContext();
	const [ deviceProperty, setDeviceProperty ] = useState< StatsDeviceProperty >( 'screensize' );

	const handleModeChange = useCallback( ( value: string ) => {
		setDeviceProperty( value as StatsDeviceProperty );
	}, [] );

	const { data, isLoading, isError } = useDeviceViews( { reportParams, max, deviceProperty } );

	const chartData: SemiCircleChartData = data.map( item => ( {
		label: item.displayLabel,
		value: item.views,
	} ) );

	// Must be called unconditionally before any early return.
	const segmentStyles = useSegmentStyles( chartData );

	if ( isError ) {
		return (
			<Stack align="center" justify="center" className={ styles.placeholder }>
				<Text>{ __( 'Could not load device data.', 'jetpack-premium-analytics' ) }</Text>
			</Stack>
		);
	}

	if ( isLoading && data.length === 0 ) {
		return <WidgetLoadingOverlay />;
	}

	const total = data.reduce( ( sum, item ) => sum + item.views, 0 );

	const legendData: LegendItem[] = data.map( item => ( {
		label: item.displayLabel,
		value: item.views,
		displayValue: formatMetricValue( item.views, DATA_FORMAT.type, DATA_FORMAT.options ),
	} ) );

	return (
		<>
			<Stack
				direction="row"
				justify="space-between"
				align="center"
				className={ styles.widgetHeader }
			>
				<Text variant="heading-md" render={ <h3 /> }>
					{ __( 'Devices', 'jetpack-premium-analytics' ) }
				</Text>
				<SelectControl
					__nextHasNoMarginBottom
					label={ __( 'View by', 'jetpack-premium-analytics' ) }
					hideLabelFromVision
					value={ deviceProperty }
					options={ DEVICE_OPTIONS }
					onChange={ handleModeChange }
					className={ styles.modeSelect }
				/>
			</Stack>
			<div className={ styles.content }>
				<SemiCircleChart
					chartData={ chartData }
					value={ total }
					styles={ segmentStyles }
					legendData={ legendData }
					showLegend
					maxWidth={ 200 }
					dataFormat={ DATA_FORMAT }
				/>
			</div>
		</>
	);
}

/**
 * Devices widget render component.
 *
 * Wraps in WidgetRoot (same bundle) so the QueryClientProvider and
 * WidgetRootContext are available to DevicesInner.
 *
 * @param root0            - Render props.
 * @param root0.attributes - Widget attributes (max).
 * @return The rendered widget content.
 */
export default function DevicesWidget( { attributes }: DevicesRenderProps ) {
	const max = attributes?.max ?? 5;

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<DevicesInner max={ max } />
			</div>
		</WidgetRoot>
	);
}
