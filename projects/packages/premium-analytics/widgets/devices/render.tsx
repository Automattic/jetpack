/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Donut,
	WIDGET_ROW_LIMIT,
	describeError,
	WidgetRoot,
	useWidgetRootContext,
	type DonutSegmentInput,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
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

	return (
		<Donut
			segments={ segments }
			status={ { isLoading, isFetching, isError, hasComparison, refetch } }
			error={ describeError( error, {
				retryDescription: __(
					"We couldn't load device data. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				onRetry: refetch,
			} ) }
			format={ PERCENTAGE_DATA_FORMAT }
			variant="half-ring"
			withTotal={ false }
			chartTitle={ __( 'Devices', 'jetpack-premium-analytics-pkg' ) }
		/>
	);
}

/**
 * Shows screen size breakdown (Desktop / Mobile / Tablet) as a semi-circle chart.
 */
export default function DevicesWidget( { attributes = {} }: DevicesWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<DevicesInner />
		</WidgetRoot>
	);
}
