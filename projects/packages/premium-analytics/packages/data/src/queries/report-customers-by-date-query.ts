/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { fetchReportCustomersByDate } from '../api/report-customers-by-date-fetch';
import { sanitizeReportCustomersByDateResponse } from '../processing/customers-by-date';
import type { ReportDataMap } from '../types';
import type { UseQueryOptions } from '@tanstack/react-query';

type RequestReportCustomersByDateParams = Parameters< typeof fetchReportCustomersByDate >[ 0 ];

const getReportCustomersByDateQueryKey = ( p: RequestReportCustomersByDateParams ) =>
	[ 'reports', 'customers', 'by-date', p.from, p.to, p.interval, p.date_type ] as const;

export function reportCustomersByDateQuery(
	params: RequestReportCustomersByDateParams
): UseQueryOptions< ReportDataMap[ 'customersByDate' ] > {
	return {
		queryKey: getReportCustomersByDateQueryKey( params ),
		queryFn: async () => {
			const response = await fetchReportCustomersByDate( params );
			return sanitizeReportCustomersByDateResponse( response );
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
