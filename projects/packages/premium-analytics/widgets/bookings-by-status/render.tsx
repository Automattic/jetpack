import { GlobalErrorProvider } from '@jetpack-premium-analytics/data';
import {
	BookingsByAttendanceWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type BookingsByStatusRenderProps = WidgetRenderProps< Partial< ReportParamsFieldAttributes > >;

/**
 * Bookings by status widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; BookingsByAttendanceWidget
 * fetches the bookings report and renders the status breakdown.
 */
export default function BookingsByStatusRender( { attributes }: BookingsByStatusRenderProps ) {
	return (
		<GlobalErrorProvider>
			<WidgetRoot attributes={ attributes } options={ { from: '/' } }>
				<BookingsByAttendanceWidget />
			</WidgetRoot>
		</GlobalErrorProvider>
	);
}
