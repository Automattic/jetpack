/**
 * Internal dependencies
 */
import { fetchProductImages, type ProductImage } from '../api/product-images-fetch';
import { fetchReportProducts } from '../api/report-products-fetch';
import { sanitizeReportProductsResponse } from '../processing/products';
import type { ReportQuery, ReportQueryType } from '@automattic/jetpack-premium-analytics-sdk';

type RequestReportProductsParams = Parameters< typeof fetchReportProducts >[ 0 ];

export type ProductsReport = ReturnType< typeof sanitizeReportProductsResponse > & {
	/** The first image of each product of the selected period, by product id. */
	images: Record< number, ProductImage >;
};

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
 * The products report with the images of its products. Only the selected period carries images:
 * the comparison period lends its values to the same rows.
 *
 * @param params    - The report request.
 * @param queryType - Which period the query answers.
 * @return The query the dashboard runs.
 */
export function reportProductsQuery(
	params: RequestReportProductsParams,
	queryType: ReportQueryType = 'primary'
): ReportQuery< ProductsReport > {
	return {
		queryKey: [ ...getReportProductsQueryKey( params ), queryType ],
		queryFn: async () => {
			const report = sanitizeReportProductsResponse( await fetchReportProducts( params ) );
			const images =
				queryType === 'primary'
					? await fetchProductImages( report.data.map( item => item.product_id ) )
					: {};

			return { ...report, images };
		},

		enabled: !! ( params.from && params.to ),

		placeholderData: previousData => previousData,
	};
}
