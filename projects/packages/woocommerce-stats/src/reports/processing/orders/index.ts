/**
 * Internal dependencies
 */
import { fetchReportOrders } from '../../api/report-orders-fetch';
import { safeParseFloat, safeParseInt } from '../../utils/parsing';
import { withBucketStamps } from '../utils';
import type { Override } from '../../utils/types';

type ReportsOrdersByDateResponse = Awaited< ReturnType< typeof fetchReportOrders > >;
type RawOrdersReportDataItem = ReportsOrdersByDateResponse[ 'data' ][ number ];
type SanitizedOrdersByDateItem = Override<
	RawOrdersReportDataItem,
	{
		/** Null for a period with no orders, which has no average. */
		average_order_value: number | null;
		avg_items: number | null;
		cogs_amount: number;
		coupons: number;
		orders_no: number;
		orders_value_gross: number;
		orders_value_net: number;
		paid_orders_count: number;
		paid_net_sales: number;
		product_net_revenue: number;
		profit_margin: number;
		refunds: number;
		total_sales: number;
		unpaid_orders_count: number;
		unpaid_net_sales: number;
	}
>;

// WordPress.com answers an average over no orders with 0 on one endpoint and null on another.
function averageOverOrders( value: unknown, ordersNo: number ): number | null {
	return ordersNo > 0 && value !== null ? safeParseFloat( value ) : null;
}

function sanitizeOrderItem(
	item: RawOrdersReportDataItem,
	zone: string
): SanitizedOrdersByDateItem {
	const ordersNo = safeParseInt( item.orders_no );

	return {
		...withBucketStamps( item, zone ),
		average_order_value: averageOverOrders( item.average_order_value, ordersNo ),
		avg_items: averageOverOrders( item.avg_items, ordersNo ),
		cogs_amount: safeParseFloat( item.cogs_amount ),
		coupons: safeParseInt( item.coupons ),
		orders_no: ordersNo,
		orders_value_gross: safeParseFloat( item.orders_value_gross ),
		orders_value_net: safeParseFloat( item.orders_value_net ),
		paid_orders_count: safeParseInt( item.paid_orders_count ),
		paid_net_sales: safeParseFloat( item.paid_net_sales ),
		product_net_revenue: safeParseFloat( item.product_net_revenue ),
		profit_margin: safeParseFloat( item.profit_margin ),
		refunds: safeParseFloat( item.refunds ),
		total_sales: safeParseFloat( item.total_sales ),
		unpaid_orders_count: safeParseInt( item.unpaid_orders_count ),
		unpaid_net_sales: safeParseFloat( item.unpaid_net_sales ),
	};
}

type SanitizedOrdersByDateResponse = {
	summary: SanitizedOrdersByDateItem;
	data: SanitizedOrdersByDateItem[];
};

/**
 * `summary` has the same shape as a `data` array item, so both go through the same
 * mapper.
 */
export const sanitizeReportOrdersResponse = (
	response: ReportsOrdersByDateResponse,
	zone: string
): SanitizedOrdersByDateResponse => {
	return {
		summary: sanitizeOrderItem( response.summary, zone ),
		data: response.data.map( item => sanitizeOrderItem( item, zone ) ),
	};
};
