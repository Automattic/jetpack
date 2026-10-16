/**
 * Internal dependencies
 */
import { fetchReportProducts } from '../api/report-products-fetch';
import { sanitizeReportProductsResponse } from '../processing/products';
import type { ReportQuery } from '@automattic/jetpack-premium-analytics-sdk';

type RequestReportProductsParams = Parameters< typeof fetchReportProducts >[ 0 ];

export type ProductsReport = ReturnType< typeof sanitizeReportProductsResponse >;

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

/**
 * The products report of a period. The images of its products are a query of their own, so the
 * rows never wait for them.
 *
 * @param params - The report request.
 * @return The query the dashboard runs.
 */
export function reportProductsQuery(
	params: RequestReportProductsParams
): ReportQuery< ProductsReport > {
	return {
		queryKey: getReportProductsQueryKey( params ),
		queryFn: async () => sanitizeReportProductsResponse( await fetchReportProducts( params ) ),

		enabled: !! ( params.from && params.to ),

		placeholderData: previousData => previousData,
	};
}
