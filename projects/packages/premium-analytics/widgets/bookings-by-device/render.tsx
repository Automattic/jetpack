/**
 * External dependencies
 */
import {
	BOOKINGS_FILTER,
	SalesByDeviceWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { BookingsByDeviceAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type BookingsByDeviceRenderAttributes = BookingsByDeviceAttributes &
	Partial< ReportParamsFieldAttributes >;

type BookingsByDeviceWidgetProps = WidgetRenderProps< BookingsByDeviceRenderAttributes > & {
	/**
	 * Dashboard error handler.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

function BookingsByDeviceWidget() {
	return (
		<SalesByDeviceWidget
			filter={ BOOKINGS_FILTER }
			emptyStateText={ __( 'No booking data in this period.', 'jetpack-premium-analytics' ) }
			errorText={ __(
				"We couldn't load booking data by device. Please try again in a moment.",
				'jetpack-premium-analytics'
			) }
		/>
	);
}

/**
 * Bookings by device widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; SalesByDeviceWidget fetches
 * the filtered bookings attribution report and renders the device breakdown.
 *
 * @param {BookingsByDeviceWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function BookingsByDeviceRender( {
	attributes = {},
	setError,
}: BookingsByDeviceWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<BookingsByDeviceWidget />
		</WidgetRoot>
	);
}
