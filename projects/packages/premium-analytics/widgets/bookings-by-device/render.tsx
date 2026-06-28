import { BookingsByDeviceWidget, WidgetRoot } from '@jetpack-premium-analytics/widgets-toolkit';
import type { ComponentProps } from 'react';

type WidgetRootProps = ComponentProps< typeof WidgetRoot >;

type BookingsByDeviceRenderProps = Pick< WidgetRootProps, 'attributes' > & {
	setError?: WidgetRootProps[ 'setError' ];
};

/**
 * Bookings by device widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; BookingsByDeviceWidget
 * fetches the bookings attribution report and renders the device breakdown.
 */
export default function BookingsByDeviceRender( {
	attributes,
	setError,
}: BookingsByDeviceRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<BookingsByDeviceWidget />
		</WidgetRoot>
	);
}
