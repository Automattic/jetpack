/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { fetchReportProducts } from '../api/report-products-fetch';
import { sanitizeReportProductsResponse } from '../processing/products';
import type { UseQueryOptions } from '@tanstack/react-query';

type RequestReportProductsParams = Parameters< typeof fetchReportProducts >[ 0 ];

type SanitizedProductsResponse = ReturnType< typeof sanitizeReportProductsResponse >;

const getReportProductsQueryKey = ( p: RequestReportProductsParams ) =>
	[
		'reports',
		'products',
		p.from,
		p.to,
		p.date_type,
		p.limit,
		p.orderby,
		p.order,
		p.filters,
	] as const;

export function reportProductsQuery(
	params: RequestReportProductsParams
): UseQueryOptions< SanitizedProductsResponse > {
	return {
		queryKey: getReportProductsQueryKey( params ),
		queryFn: async () => {
			const response = await fetchReportProducts( params );
			return sanitizeReportProductsResponse( response );
		},

		/**
		 * Enable the query only if the from and to are set.
		 */
		enabled: !! ( params.from && params.to ),

		/**
		 * Keep previous data while fetching new data to prevent blank states
		 */
		placeholderData: previousData => previousData,
	};
}
