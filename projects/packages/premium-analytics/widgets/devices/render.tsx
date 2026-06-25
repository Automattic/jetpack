/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import {
	LeaderboardChart,
	WidgetLoadingOverlay,
	WidgetRoot,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import useDeviceViews from './use-device-views';

type DevicesRenderProps = {
	attributes?: Partial< ReportParamsFieldAttributes > & {
		max?: number;
		deviceProperty?: 'screensize' | 'browser';
	};
};

/**
 * Inner component — rendered inside WidgetRoot so useWidgetRootContext
 * and useStatsDevices (TanStack Query) both have their required providers.
 *
 * @param root0                - Props.
 * @param root0.max            - Max rows to display.
 * @param root0.deviceProperty - Device dimension to break down by.
 * @return The rendered leaderboard or state placeholder.
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

	if ( isError ) {
		return <Text>{ __( 'Could not load device data.', 'jetpack-premium-analytics' ) }</Text>;
	}

	if ( isLoading && data.length === 0 ) {
		return <WidgetLoadingOverlay />;
	}

	const maxViews = Math.max( ...data.map( d => d.views ), 1 );
	const leaderboardData: LeaderboardChartData = data.map( ( item, index ) => ( {
		id: `${ index }-${ item.label }`,
		label: item.displayLabel,
		currentValue: item.views,
		currentShare: ( item.views / maxViews ) * 100,
		previousValue: 0,
		previousShare: 0,
		delta: 0,
	} ) );

	return (
		<LeaderboardChart
			data={ leaderboardData }
			loading={ isLoading }
			withOverlayLabel
			emptyStateText={ __( 'No device data in this period.', 'jetpack-premium-analytics' ) }
			dataFormat={ { type: 'number', options: { useMultipliers: true, decimals: 0 } } }
		/>
	);
}

/**
 * Devices widget render component.
 *
 * Wraps in WidgetRoot (same bundle) so the QueryClientProvider and
 * WidgetRootContext are available to DevicesInner. The host passes
 * reportParams via attributes.reportParams.
 *
 * @param root0            - Render props.
 * @param root0.attributes - Widget attributes (reportParams, max, deviceProperty).
 * @return The rendered widget content.
 */
export default function DevicesWidget( { attributes }: DevicesRenderProps ) {
	const max = attributes?.max ?? 5;
	const deviceProperty = attributes?.deviceProperty ?? 'screensize';

	return (
		<WidgetRoot attributes={ attributes }>
			<DevicesInner max={ max } deviceProperty={ deviceProperty } />
		</WidgetRoot>
	);
}
