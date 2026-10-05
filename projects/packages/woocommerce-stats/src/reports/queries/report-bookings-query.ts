/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { resolveReportTimeZone } from '@jetpack-premium-analytics/data/src/utils/report-timezone';
import { fetchReportBookings } from '../api/report-bookings-fetch';
import { sanitizeReportBookingsResponse } from '../processing/bookings';
import type { UseQueryOptions } from '@tanstack/react-query';

type RequestReportBookingsParams = Parameters< typeof fetchReportBookings >[ 0 ];

const getReportBookingsQueryKey = ( p: RequestReportBookingsParams ) =>
	[ 'reports', 'bookings', 'by-date', p.from, p.to, p.interval, p.date_type, p.filters ] as const;

export function reportBookingsQuery(
	params: RequestReportBookingsParams
): UseQueryOptions< ReturnType< typeof sanitizeReportBookingsResponse > > {
	const timezone = resolveReportTimeZone();

	return {
		queryKey: [ ...getReportBookingsQueryKey( params ), timezone ],
		queryFn: async () => {
			const response = await fetchReportBookings( params );
			return sanitizeReportBookingsResponse( response, timezone );
		},

		enabled: !! ( params.from && params.to && params.interval ),

		placeholderData: previousData => previousData,
	};
}
