/**
 * Internal dependencies
 */
import { hasProductFilters } from '@jetpack-premium-analytics/data/src/utils/product-filters';
import { fetchReport } from '../../fetch-report';
import type { FilterCondition } from '@jetpack-premium-analytics/data/src/types/filter-condition';
import type { BaseReportParams } from '@jetpack-premium-analytics/data/src/utils/types';

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
	const endpoint = hasProductFilters( filters )
		? 'orders-by-product-type/by-date'
		: 'orders/by-date';

	return fetchReport< ReportsOrdersByDateResponse >( endpoint, {
		from,
		to,
		interval,
		filters,
		date_type,
	} );
}
