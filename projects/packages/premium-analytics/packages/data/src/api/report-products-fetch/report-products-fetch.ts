/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { BaseReportParams } from '../../utils/types';
import { reportsPath } from '../constants';
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

/**
 * Fetches products report data from the WooCommerce Analytics API
 */
export async function fetchReportProducts(
	params: RequestReportProductsParams
): Promise< ReportProductsResponse > {
	const queryArgs: Record< string, any > = {
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

	// Add filters to query params if provided
	if ( params.filters && params.filters.length > 0 ) {
		queryArgs.filters = params.filters;
	}

	return apiFetch< ReportProductsResponse >( {
		path: addQueryArgs( `${ reportsPath }/products`, queryArgs ),
	} );
}
