/**
 * External dependencies
 */
/**
 * Internal dependencies
 */
import { fetchReportCustomersByDate } from '../api/report-customers-by-date-fetch';
import { sanitizeReportCustomersByDateResponse } from '../processing/customers-by-date';
import { resolveReportTimeZone } from '../utils/report-timezone';
import type { ReportQuery } from '@automattic/jetpack-premium-analytics-sdk';

type RequestReportCustomersByDateParams = Parameters< typeof fetchReportCustomersByDate >[ 0 ];

const getReportCustomersByDateQueryKey = ( p: RequestReportCustomersByDateParams ) =>
	[ 'reports', 'customers', 'by-date', p.from, p.to, p.interval, p.date_type ] as const;

export function reportCustomersByDateQuery(
	params: RequestReportCustomersByDateParams
): ReportQuery< ReturnType< typeof sanitizeReportCustomersByDateResponse > > {
	const timezone = resolveReportTimeZone();

	return {
		queryKey: [ ...getReportCustomersByDateQueryKey( params ), timezone ],
		queryFn: async () => {
			const response = await fetchReportCustomersByDate( params );
			return sanitizeReportCustomersByDateResponse( response, timezone );
		},

		enabled: !! ( params.from && params.to && params.interval ),

		placeholderData: previousData => previousData,
	};
}
