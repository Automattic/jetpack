import {
	BookingsByDeviceWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';

type BookingsByDeviceRenderProps = {
	attributes?: Partial< ReportParamsFieldAttributes >;
};

/**
 * Bookings by device widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; BookingsByDeviceWidget
 * fetches the bookings attribution report and renders the device breakdown.
 */
export default function BookingsByDeviceRender( { attributes }: BookingsByDeviceRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } options={ { from: '/' } }>
			<BookingsByDeviceWidget />
		</WidgetRoot>
	);
}
