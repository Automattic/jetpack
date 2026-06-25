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
	type ReportParamsFieldAttributes,
	type SemiCircleChartData,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useDeviceViews from './use-device-views';

type DevicesRenderProps = {
	attributes?: Partial< ReportParamsFieldAttributes > & {
		max?: number;
		deviceProperty?: 'screensize' | 'browser';
	};
};

const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

/**
 * Inner component — rendered inside WidgetRoot so useWidgetRootContext
 * and useStatsDevices (TanStack Query) both have their required providers.
 *
 * @param root0                - Props.
 * @param root0.max            - Max rows to display.
 * @param root0.deviceProperty - Device dimension to break down by.
 * @return The rendered semi-circle chart or state placeholder.
 */
function DevicesInner( {
	max,
	deviceProperty,
}: {
	max: number;
	deviceProperty: 'screensize' | 'browser';
} ) {
	const { reportParams } = useWidgetRootContext();
	const { data, isLoading, isError } = useDeviceViews( { reportParams, max, deviceProperty } );

	const chartData: SemiCircleChartData = data.map( item => ( {
		label: item.displayLabel,
		value: item.views,
	} ) );

	// Must be called unconditionally before any early return.
	const segmentStyles = useSegmentStyles( chartData );

	const headerLabel =
		deviceProperty === 'browser'
			? __( 'Browsers', 'jetpack-premium-analytics' )
			: __( 'Screen sizes', 'jetpack-premium-analytics' );

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

	return (
		<>
			<Stack
				direction="row"
				justify="space-between"
				align="center"
				className={ styles.widgetHeader }
			>
				<Text>{ headerLabel }</Text>
			</Stack>
			<div className={ styles.content }>
				<SemiCircleChart
					chartData={ chartData }
					value={ total }
					styles={ segmentStyles }
					maxWidth={ 250 }
					dataFormat={ DATA_FORMAT }
				/>
				<div className={ styles.legend }>
					{ data.map( ( item, index ) => (
						<div key={ item.label } className={ styles.legendRow }>
							<span
								className={ styles.legendDot }
								style={ { backgroundColor: segmentStyles[ index ]?.color } }
							/>
							<span className={ styles.legendLabel }>{ item.displayLabel }</span>
							<span className={ styles.legendValue }>
								{ formatMetricValue( item.views, DATA_FORMAT.type, DATA_FORMAT.options ) }
							</span>
						</div>
					) ) }
				</div>
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
 * @param root0.attributes - Widget attributes (max, deviceProperty).
 * @return The rendered widget content.
 */
export default function DevicesWidget( { attributes }: DevicesRenderProps ) {
	const max = attributes?.max ?? 5;
	const deviceProperty = attributes?.deviceProperty ?? 'screensize';

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<DevicesInner max={ max } deviceProperty={ deviceProperty } />
			</div>
		</WidgetRoot>
	);
}
