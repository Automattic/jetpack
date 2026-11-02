/**
 * Internal dependencies
 */
import { fetchReportCustomers } from '../api/report-customers-fetch';
import { sanitizeReportCustomersResponse } from '../processing/customers';
import type { ReportQuery } from '@automattic/jetpack-premium-analytics-sdk';

type RequestReportCustomersParams = Parameters< typeof fetchReportCustomers >[ 0 ];

const getReportCustomersQueryKey = ( p: RequestReportCustomersParams ) => [
	'reports',
	'customers',
	'new-returning',
	p.from,
	p.to,
	p.date_type,
	p.filters,
];

export function reportCustomersQuery(
	params: RequestReportCustomersParams
): ReportQuery< ReturnType< typeof sanitizeReportCustomersResponse > > {
	return {
		queryKey: getReportCustomersQueryKey( params ),
		queryFn: async () => {
			const response = await fetchReportCustomers( params );
			return sanitizeReportCustomersResponse( response );
		},

		// The customers endpoint takes no interval.
		enabled: !! ( params.from && params.to ),

		placeholderData: previousData => previousData,
	};
}
