/**
 * Internal dependencies
 */
import { fetchReportBookings } from '../../api/report-bookings-fetch';
import { safeParseInt } from '../../utils/parsing';
import type { Override } from '../../utils/types';

type ReportsBookingsByDateResponse = Awaited< ReturnType< typeof fetchReportBookings > >;
type RawBookingsReportDataItem = ReportsBookingsByDateResponse[ 'data' ][ number ];
type RawBookingsReportSummaryItem = ReportsBookingsByDateResponse[ 'summary' ];

type SanitizedBookingsByDateItem = Override<
	RawBookingsReportDataItem,
	{
		status_unpaid: number;
		status_pending_confirmation: number;
		status_confirmed: number;
		status_paid: number;
		status_cancelled: number;
		status_complete: number;
		attendance_status_booked: number;
		attendance_status_no_show: number;
		attendance_status_checked_in: number;
	}
>;

type SanitizedBookingsSummaryItem = Override<
	RawBookingsReportSummaryItem,
	{
		status_unpaid: number;
		status_pending_confirmation: number;
		status_confirmed: number;
		status_paid: number;
		status_cancelled: number;
		status_complete: number;
		attendance_status_booked: number;
		attendance_status_no_show: number;
		attendance_status_checked_in: number;
	}
>;

/**
 * Sanitize/process a single booking item by converting strings to numbers
 */
function sanitizeBookingItem( item: RawBookingsReportDataItem ): SanitizedBookingsByDateItem {
	return {
		...item,
		status_unpaid: safeParseInt( item.status_unpaid ),
		status_pending_confirmation: safeParseInt( item.status_pending_confirmation ),
		status_confirmed: safeParseInt( item.status_confirmed ),
		status_paid: safeParseInt( item.status_paid ),
		status_cancelled: safeParseInt( item.status_cancelled ),
		status_complete: safeParseInt( item.status_complete ),
		attendance_status_booked: safeParseInt( item.attendance_status_booked ),
		attendance_status_no_show: safeParseInt( item.attendance_status_no_show ),
		attendance_status_checked_in: safeParseInt( item.attendance_status_checked_in ),
	};
}

/**
 * Sanitize/process a single booking summary item by converting strings to numbers
 */
function sanitizeBookingSummaryItem(
	item: RawBookingsReportSummaryItem
): SanitizedBookingsSummaryItem {
	return {
		...item,
		status_unpaid: safeParseInt( item.status_unpaid ),
		status_pending_confirmation: safeParseInt( item.status_pending_confirmation ),
		status_confirmed: safeParseInt( item.status_confirmed ),
		status_paid: safeParseInt( item.status_paid ),
		status_cancelled: safeParseInt( item.status_cancelled ),
		status_complete: safeParseInt( item.status_complete ),
		attendance_status_booked: safeParseInt( item.attendance_status_booked ),
		attendance_status_no_show: safeParseInt( item.attendance_status_no_show ),
		attendance_status_checked_in: safeParseInt( item.attendance_status_checked_in ),
	};
}

/**
 * Processed response with numeric values
 */
type SanitizedBookingsByDateResponse = {
	summary: SanitizedBookingsSummaryItem;
	data: SanitizedBookingsByDateItem[];
};

/**
 * Sanitize the response from the reports/bookings/by-date endpoint
 * Converts string values to numbers for easier calculations and charting.
 *
 * The `summary` and `data` items have different structures (summary lacks time_interval),
 * so we use different sanitizer functions for each.
 */
export const sanitizeReportBookingsResponse = (
	response: ReportsBookingsByDateResponse
): SanitizedBookingsByDateResponse => {
	return {
		summary: sanitizeBookingSummaryItem( response.summary ),
		data: response.data.map( sanitizeBookingItem ),
	};
};
