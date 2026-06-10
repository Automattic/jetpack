/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { reportsPath } from '../constants';
import type { FilterCondition } from '../../types/filter-condition';
import type { BaseReportParams } from '../../utils/types';

type ReportsBookingsByDateSummary = {
	status_unpaid: string;
	status_pending_confirmation: string;
	status_confirmed: string;
	status_paid: string;
	status_cancelled: string;
	status_complete: string;
	attendance_status_booked: string;
	attendance_status_no_show: string;
	attendance_status_checked_in: string;
	date_start: string;
	date_end: string;
};

type BookingsReportDataItem = ReportsBookingsByDateSummary & {
	time_interval: string;
};

export type ReportsBookingsByDateResponse = {
	data: BookingsReportDataItem[];
	summary: ReportsBookingsByDateSummary;
};

export type RequestReportBookingsParams = BaseReportParams & {
	filters?: FilterCondition[];
};

export async function fetchReportBookings( {
	from,
	to,
	interval,
	filters,
	date_type,
}: RequestReportBookingsParams ): Promise< ReportsBookingsByDateResponse > {
	const apiUrl = `${ reportsPath }/bookings/by-date`;

	const path = addQueryArgs( apiUrl, {
		from,
		to,
		interval,
		filters,
		date_type,
	} );

	return apiFetch( { path } ) as Promise< ReportsBookingsByDateResponse >;
}
