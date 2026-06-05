/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { hasProductFilters } from '../../utils/product-filters';
import { reportsPath } from '../constants';
import type { FilterCondition } from '../../types/filter-condition';
import type { BaseReportParams } from '../../utils/types';

type ReportsOrdersByDateSummary = {
	average_order_value: string;
	avg_items: string;
	cogs_amount: string;
	coupons: string;
	date_end: string;
	date_start: string;
	orders_no: string;
	orders_value_gross: string;
	orders_value_net: string;
	paid_orders_count: string;
	paid_net_sales: string;
	product_net_revenue: string;
	profit_margin: string;
	refunds: string;
	total_sales: string;
	unpaid_orders_count: string;
	unpaid_net_sales: string;
};

type OrdersReportDataItem = ReportsOrdersByDateSummary & {
	time_interval?: string;
};

export type ReportsOrdersByDateResponse = {
	data: OrdersReportDataItem[];
	summary: ReportsOrdersByDateSummary;
};

export type RequestReportOrdersParams = BaseReportParams & {
	filters?: FilterCondition[];
};

export async function fetchReportOrders( {
	from,
	to,
	interval,
	filters,
	date_type,
}: RequestReportOrdersParams ): Promise< ReportsOrdersByDateResponse > {
	const hasProductFiltersValue = hasProductFilters( filters );
	const apiUrl = hasProductFiltersValue
		? `${ reportsPath }/orders-by-product-type/by-date`
		: `${ reportsPath }/orders/by-date`;

	const path = addQueryArgs( apiUrl, {
		from,
		to,
		interval,
		filters,
		date_type,
	} );

	return apiFetch( { path } ) as Promise< ReportsOrdersByDateResponse >;
}
