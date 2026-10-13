/**
 * Internal dependencies
 */
import { fetchReport, type ReportRequestParams } from '../../fetch-report';
import { BaseReportParams } from '../../utils/types';
import type { FilterCondition } from '../../types/filter-condition';

export type RequestReportProductsParams = Omit< BaseReportParams, 'interval' > & {
	limit?: number;
	orderby?: string;
	order?: 'asc' | 'desc';
	filters?: FilterCondition[];
};

type ReportProductsResponse = {
	data: {
		product_id: string;
		product_name: string;
		product_net_revenue: string;
		product_gross_revenue: string;
		product_type: string;
		orders_count: string;
		sku: string;
		total_quantity: string;
		stock_status: string;
	}[];
	summary: {
		total_orders: string;
		total_products: string;
		total_quantity: string;
		total_revenue: string;
	};
};

export async function fetchReportProducts(
	params: RequestReportProductsParams
): Promise< ReportProductsResponse > {
	const queryArgs: ReportRequestParams = {
		from: params.from,
		to: params.to,
		date_type: params.date_type,
	};

	if ( params.limit ) {
		queryArgs.limit = params.limit;
	}

	if ( params.orderby ) {
		queryArgs.orderby = params.orderby;
	}

	if ( params.order ) {
		queryArgs.order = params.order;
	}

	if ( params.filters && params.filters.length > 0 ) {
		queryArgs.filters = params.filters;
	}

	return fetchReport< ReportProductsResponse >( 'products', queryArgs );
}
