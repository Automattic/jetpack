/**
 * External dependencies
 */
import {
	BookingConversionRateWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import type { StoreConversionRateBookingsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type StoreConversionRateBookingsRenderAttributes = StoreConversionRateBookingsAttributes &
	Partial< ReportParamsFieldAttributes >;

type StoreConversionRateBookingsWidgetProps =
	WidgetRenderProps< StoreConversionRateBookingsRenderAttributes > & {
		setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
	};

/**
 * Store conversion rate bookings widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; BookingConversionRateWidget
 * fetches the conversion-rate report with bookings filters and renders the
 * funnel.
 *
 * @param {StoreConversionRateBookingsWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function StoreConversionRateBookingsRender( {
	attributes = {},
	setError,
}: StoreConversionRateBookingsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<BookingConversionRateWidget />
		</WidgetRoot>
	);
}
