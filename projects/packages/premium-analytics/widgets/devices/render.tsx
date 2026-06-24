/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import {
	LeaderboardChart,
	WidgetLoadingOverlay,
	WidgetRootContext,
	type LeaderboardChartData,
	type WidgetRootContextValue,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import useDeviceViews from './use-device-views';
import type { DevicesAttributes } from './widget';
import type { ReportParams } from '@jetpack-premium-analytics/data';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

interface DevicesInnerProps {
	reportParams: ReportParams;
	max: number;
	deviceProperty: 'screensize' | 'browser';
}

/**
 * Inner component — only rendered when reportParams is available.
 * Keeps all hook calls (TanStack Query) away from the picker preview path.
 *
 * @param root0                - Props.
 * @param root0.reportParams   - Date range / comparison from WidgetRoot context.
 * @param root0.max            - Max rows.
 * @param root0.deviceProperty - Device dimension.
 * @return The rendered leaderboard or state placeholder.
 */
function DevicesInner( { reportParams, max, deviceProperty }: DevicesInnerProps ) {
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
 * Uses WidgetRootContext (non-throwing) to get reportParams so the widget
 * picker preview (no WidgetRoot) renders a static placeholder instead of
 * crashing. DevicesInner is only mounted when reportParams is available,
 * keeping TanStack Query hooks away from the preview render path.
 *
 * @param root0            - Render props.
 * @param root0.attributes - Widget attributes injected by the host.
 * @return The rendered widget content.
 */
export default function DevicesWidget( {
	attributes = {},
}: WidgetRenderProps< DevicesAttributes > ) {
	const context = useContext( WidgetRootContext ) as WidgetRootContextValue | null;
	const reportParams = context?.reportParams;
	const max = attributes.max ?? 5;
	const deviceProperty = attributes.deviceProperty ?? 'screensize';

	if ( ! reportParams ) {
		return <WidgetLoadingOverlay />;
	}

	return (
		<DevicesInner reportParams={ reportParams } max={ max } deviceProperty={ deviceProperty } />
	);
}
