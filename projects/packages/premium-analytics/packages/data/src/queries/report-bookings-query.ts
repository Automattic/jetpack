/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { fetchReportBookings } from '../api';
import { sanitizeReportBookingsResponse } from '../processing/bookings';
import type { ReportDataMap } from '../types';
import type { UseQueryOptions } from '@tanstack/react-query';

type RequestReportBookingsParams = Parameters< typeof fetchReportBookings >[ 0 ];

const getReportBookingsQueryKey = ( p: RequestReportBookingsParams ) =>
	[ 'reports', 'bookings', 'by-date', p.from, p.to, p.interval, p.date_type, p.filters ] as const;

export function reportBookingsQuery(
	params: RequestReportBookingsParams
): UseQueryOptions< ReportDataMap[ 'bookings' ] > {
	return {
		queryKey: getReportBookingsQueryKey( params ),
		queryFn: async () => {
			const response = await fetchReportBookings( params );
			return sanitizeReportBookingsResponse( response );
		},

		/**
		 * Enable the query only if the from, to, and interval are set.
		 */
		enabled: !! ( params.from && params.to && params.interval ),

		/**
		 * Keep previous data while fetching new data to prevent blank states
		 */
		placeholderData: previousData => previousData,
	};
}
