/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { fetchReportOrders } from '../api/report-orders-fetch';
import { sanitizeReportOrdersResponse } from '../processing/orders';
import { resolveReportTimeZone } from '../utils/report-timezone';
import type { ReportQuery } from '../utils/types';

type RequestReportOrdersParams = Parameters< typeof fetchReportOrders >[ 0 ];

const getReportOrdersQueryKey = ( p: RequestReportOrdersParams ) => [
	'reports',
	'orders',
	p.from,
	p.to,
	p.interval,
	p.date_type,
	p.filters || [],
];

export function reportOrdersQuery(
	params: RequestReportOrdersParams
): ReportQuery< ReturnType< typeof sanitizeReportOrdersResponse > > {
	const timezone = resolveReportTimeZone();

	return {
		queryKey: [ ...getReportOrdersQueryKey( params ), timezone ],
		queryFn: async () => {
			const response = await fetchReportOrders( params );
			return sanitizeReportOrdersResponse( response, timezone );
		},

		enabled: !! ( params.from && params.to && params.interval ),

		placeholderData: previousData => previousData,
	};
}
