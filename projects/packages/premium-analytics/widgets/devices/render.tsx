/**
 * WordPress dependencies
 */
import {
	LeaderboardChart,
	WidgetLoadingOverlay,
	useWidgetRootContext,
	type LeaderboardChartData,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import useDeviceViews from './use-device-views';
import type { DevicesAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * Devices widget render component.
 *
 * Reads report params from WidgetRoot context (provided by the host).
 * Renders a leaderboard of visitor counts broken down by device type.
 *
 * @param root0            - Render props.
 * @param root0.attributes - Widget attributes (max, deviceProperty).
 * @return The rendered widget content.
 */
export default function DevicesWidget( {
	attributes = {},
}: WidgetRenderProps< DevicesAttributes > ) {
	const { reportParams } = useWidgetRootContext();
	const max = attributes.max ?? 5;
	const deviceProperty = attributes.deviceProperty ?? 'screensize';

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
