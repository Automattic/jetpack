/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { fetchReportOrders } from '../api';
import { sanitizeReportOrdersResponse } from '../processing/orders';
import type { ReportDataMap } from '../types';
import type { UseQueryOptions } from '@tanstack/react-query';

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
): UseQueryOptions< ReportDataMap[ 'orders' ] > {
	return {
		queryKey: getReportOrdersQueryKey( params ),
		queryFn: async () => {
			const response = await fetchReportOrders( params );
			return sanitizeReportOrdersResponse( response );
		},

		enabled: !! ( params.from && params.to && params.interval ),

		placeholderData: previousData => previousData,
	};
}
