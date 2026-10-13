/**
 * Internal dependencies
 */
import { fetchReportProducts } from '../../api/report-products-fetch';
import type { Override } from '../../utils/types';

type ReportProductsResponse = Awaited< ReturnType< typeof fetchReportProducts > >;

type RawProductsReportDataItem = ReportProductsResponse[ 'data' ][ number ];
type RawProductsReportSummary = ReportProductsResponse[ 'summary' ];

type SanitizedProductsItem = Override<
	RawProductsReportDataItem,
	{
		product_id: number;
		orders_count: number;
		product_net_revenue: number;
		total_quantity: number;
	}
>;

type SanitizedProductsSummary = Override<
	RawProductsReportSummary,
	{
		total_orders: number;
		total_products: number;
		total_quantity: number;
		total_revenue: number;
	}
>;

function sanitizeProductItem( item: RawProductsReportDataItem ): SanitizedProductsItem {
	return {
		...item,
		product_id: parseInt( item.product_id, 10 ),
		orders_count: parseInt( item.orders_count, 10 ),
		product_net_revenue: parseFloat( item.product_net_revenue ),
		total_quantity: parseInt( item.total_quantity, 10 ),
	};
}

function sanitizeProductSummary( summary: RawProductsReportSummary ): SanitizedProductsSummary {
	return {
		...summary,
		total_orders: parseInt( summary.total_orders, 10 ),
		total_products: parseInt( summary.total_products, 10 ),
		total_quantity: parseInt( summary.total_quantity, 10 ),
		total_revenue: parseFloat( summary.total_revenue ),
	};
}

type SanitizedProductsResponse = {
	summary: SanitizedProductsSummary;
	data: SanitizedProductsItem[];
};

export const sanitizeReportProductsResponse = (
	response: ReportProductsResponse
): SanitizedProductsResponse => {
	return {
		summary: sanitizeProductSummary( response.summary ),
		data: ( response.data || [] ).map( sanitizeProductItem ),
	};
};
