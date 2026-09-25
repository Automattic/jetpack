/**
 * Mock data generator for bookings endpoint
 *
 * API endpoint: /jetpack-premium-analytics/v1/proxy/v2/analytics/reports/bookings/by-date
 *
 * This module provides dynamic fixture generation based on request parameters.
 */
import { wooBucketStamp } from '../../../__fixtures__/woo-bucket-stamp';
import { seededRandom } from './orders-by-product-type';
import type { fetchReportBookings } from '../../../../../data/src/api/report-bookings-fetch/report-bookings-fetch';

/**
 * Infer the response type from the fetch function.
 */
type BookingsReportResponse = Awaited< ReturnType< typeof fetchReportBookings > >;

interface GenerateBookingsParams {
	from: string; // ISO date string
	to: string; // ISO date string
	interval?: 'day' | 'week' | 'month';
	/**
	 * Optional seed for reproducible random data.
	 */
	seed?: number;
	/**
	 * Generic density parameter (0-1).
	 * For bookings: probability that a day will have bookings
	 * Default: 0.8 (80% of days have bookings)
	 */
	density?: number;
	/**
	 * Generic volume parameter.
	 * For bookings: average total bookings per active day
	 * Default: 5
	 */
	volume?: number;
}

function generateDateIntervals(
	from: string,
	to: string,
	interval: 'day' | 'week' | 'month' = 'day'
): Array< { start: Date; end: Date } > {
	const startDate = new Date( from );
	const endDate = new Date( to );
	const intervals: Array< { start: Date; end: Date } > = [];

	const current = new Date( startDate );

	while ( current <= endDate ) {
		const intervalStart = new Date( current );
		let intervalEnd: Date;

		switch ( interval ) {
			case 'day':
				intervalEnd = new Date( current );
				intervalEnd.setHours( 23, 59, 59, 999 );
				current.setDate( current.getDate() + 1 );
				break;
			case 'week':
				intervalEnd = new Date( current );
				intervalEnd.setDate( intervalEnd.getDate() + 6 );
				intervalEnd.setHours( 23, 59, 59, 999 );
				current.setDate( current.getDate() + 7 );
				break;
			case 'month':
				intervalEnd = new Date( current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999 );
				current.setMonth( current.getMonth() + 1 );
				break;
		}

		if ( intervalEnd > endDate ) {
			intervalEnd = new Date( endDate );
		}

		intervals.push( {
			start: intervalStart,
			end: intervalEnd,
		} );

		if ( intervalEnd >= endDate ) {
			break;
		}
	}

	return intervals;
}

// `time_interval` is a date-only field.
function formatDateOnly( date: Date ): string {
	return date.toISOString().split( 'T' )[ 0 ];
}

function generateIntervalData(
	start: Date,
	end: Date,
	random: () => number,
	density: number,
	volume: number
): BookingsReportResponse[ 'data' ][ 0 ] {
	const hasBookings = random() < density;

	if ( ! hasBookings ) {
		return {
			time_interval: formatDateOnly( start ),
			date_start: wooBucketStamp( start ),
			date_end: wooBucketStamp( end ),
			status_unpaid: '0',
			status_pending_confirmation: '0',
			status_confirmed: '0',
			status_paid: '0',
			status_cancelled: '0',
			status_complete: '0',
			attendance_status_booked: '0',
			attendance_status_no_show: '0',
			attendance_status_checked_in: '0',
		};
	}

	// Generate varied booking counts for each status independently
	// This creates more natural "wavy" data patterns

	const generateCount = ( base: number, variance: number ): number => {
		const wave = Math.sin( random() * Math.PI * 2 ) * variance;
		const noise = ( random() - 0.5 ) * variance;
		return Math.max( 1, Math.round( base + wave + noise ) );
	};

	const scaleFactor = volume / 5; // normalize around default volume of 5

	const statusUnpaid = generateCount( 2 * scaleFactor, 3 * scaleFactor );
	const statusPendingConfirmation = generateCount( 2 * scaleFactor, 2 * scaleFactor );
	const statusConfirmed = generateCount( 3 * scaleFactor, 4 * scaleFactor );
	const statusPaid = generateCount( 4 * scaleFactor, 5 * scaleFactor );
	const statusCancelled = generateCount( 2 * scaleFactor, 3 * scaleFactor );
	const statusComplete = generateCount( 5 * scaleFactor, 6 * scaleFactor );

	const attendanceBooked = generateCount( 3 * scaleFactor, 4 * scaleFactor );
	const attendanceNoShow = generateCount( 1 * scaleFactor, 2 * scaleFactor );
	const attendanceCheckedIn = generateCount( 4 * scaleFactor, 5 * scaleFactor );

	return {
		time_interval: formatDateOnly( start ),
		date_start: wooBucketStamp( start ),
		date_end: wooBucketStamp( end ),
		status_unpaid: statusUnpaid.toString(),
		status_pending_confirmation: statusPendingConfirmation.toString(),
		status_confirmed: statusConfirmed.toString(),
		status_paid: statusPaid.toString(),
		status_cancelled: statusCancelled.toString(),
		status_complete: statusComplete.toString(),
		attendance_status_booked: attendanceBooked.toString(),
		attendance_status_no_show: attendanceNoShow.toString(),
		attendance_status_checked_in: attendanceCheckedIn.toString(),
	};
}

function calculateSummary(
	data: BookingsReportResponse[ 'data' ],
	from: string,
	to: string
): BookingsReportResponse[ 'summary' ] {
	const totals = data.reduce(
		( acc, item ) => ( {
			status_unpaid: acc.status_unpaid + parseInt( item.status_unpaid || '0', 10 ),
			status_pending_confirmation:
				acc.status_pending_confirmation + parseInt( item.status_pending_confirmation || '0', 10 ),
			status_confirmed: acc.status_confirmed + parseInt( item.status_confirmed || '0', 10 ),
			status_paid: acc.status_paid + parseInt( item.status_paid || '0', 10 ),
			status_cancelled: acc.status_cancelled + parseInt( item.status_cancelled || '0', 10 ),
			status_complete: acc.status_complete + parseInt( item.status_complete || '0', 10 ),
			attendance_status_booked:
				acc.attendance_status_booked + parseInt( item.attendance_status_booked || '0', 10 ),
			attendance_status_no_show:
				acc.attendance_status_no_show + parseInt( item.attendance_status_no_show || '0', 10 ),
			attendance_status_checked_in:
				acc.attendance_status_checked_in + parseInt( item.attendance_status_checked_in || '0', 10 ),
		} ),
		{
			status_unpaid: 0,
			status_pending_confirmation: 0,
			status_confirmed: 0,
			status_paid: 0,
			status_cancelled: 0,
			status_complete: 0,
			attendance_status_booked: 0,
			attendance_status_no_show: 0,
			attendance_status_checked_in: 0,
		}
	);

	return {
		status_unpaid: totals.status_unpaid.toString(),
		status_pending_confirmation: totals.status_pending_confirmation.toString(),
		status_confirmed: totals.status_confirmed.toString(),
		status_paid: totals.status_paid.toString(),
		status_cancelled: totals.status_cancelled.toString(),
		status_complete: totals.status_complete.toString(),
		attendance_status_booked: totals.attendance_status_booked.toString(),
		attendance_status_no_show: totals.attendance_status_no_show.toString(),
		attendance_status_checked_in: totals.attendance_status_checked_in.toString(),
		date_start: wooBucketStamp( new Date( from ) ),
		date_end: wooBucketStamp( new Date( to ) ),
	};
}

/**
 * Generate mock dynamic data for the bookings endpoint
 *
 * @param params - Generation parameters based on the request
 * @return Mock data that matches the API format
 */
export function generateBookings( params: GenerateBookingsParams ): BookingsReportResponse {
	const { from, to, interval = 'day', seed = Date.now(), density = 0.8, volume = 5 } = params;

	const random = seededRandom( seed );
	const intervals = generateDateIntervals( from, to, interval );

	const data = intervals.map( ( { start, end } ) =>
		generateIntervalData( start, end, random, density, volume )
	);

	const summary = calculateSummary( data, from, to );

	return {
		summary,
		data,
	};
}

export function filterBookingsDataByDateRange(
	fullData: BookingsReportResponse[ 'data' ],
	requestFrom: string,
	requestTo: string
): BookingsReportResponse[ 'data' ] {
	const fromDate = new Date( requestFrom );
	const toDate = new Date( requestTo );

	return fullData.filter( item => {
		const itemDate = new Date( item.date_start );
		return itemDate >= fromDate && itemDate <= toDate;
	} );
}

export function recalculateBookingsSummary(
	filteredData: BookingsReportResponse[ 'data' ],
	from: string,
	to: string
): BookingsReportResponse[ 'summary' ] {
	if ( filteredData.length === 0 ) {
		return {
			status_unpaid: '0',
			status_pending_confirmation: '0',
			status_confirmed: '0',
			status_paid: '0',
			status_cancelled: '0',
			status_complete: '0',
			attendance_status_booked: '0',
			attendance_status_no_show: '0',
			attendance_status_checked_in: '0',
			date_start: wooBucketStamp( new Date( from ) ),
			date_end: wooBucketStamp( new Date( to ) ),
		};
	}

	return calculateSummary( filteredData, from, to );
}
