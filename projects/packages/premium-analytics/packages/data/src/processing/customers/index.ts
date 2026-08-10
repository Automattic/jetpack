/**
 * Internal dependencies
 */
import { fetchReportCustomers } from '../../api/report-customers-fetch';
import { safeParseFloat, safeParseInt } from '../../utils/parsing';
import type { Override } from '../../utils/types';

type ReportsCustomersNewReturningResponse = Awaited< ReturnType< typeof fetchReportCustomers > >;
type RawCustomersNewReturningSummary = ReportsCustomersNewReturningResponse[ 'summary' ];
type RawCustomersNewReturningItem = ReportsCustomersNewReturningResponse[ 'data' ][ number ];

type SanitizedCustomersNewReturningSummary = Override<
	RawCustomersNewReturningSummary,
	{
		total_net_sales: number;
		total_orders: number;
		new_customer_sales: number;
		returning_customer_sales: number;
	}
>;

type SanitizedCustomersNewReturningItem = Override<
	RawCustomersNewReturningItem,
	{
		net_sales: number;
		orders_count: number;
	}
>;

type SanitizedCustomersNewReturningResponse = {
	summary: SanitizedCustomersNewReturningSummary;
	data: SanitizedCustomersNewReturningItem[];
};

function sanitizeCustomerItem(
	item: RawCustomersNewReturningItem
): SanitizedCustomersNewReturningItem {
	return {
		...item,
		net_sales: safeParseFloat( item.net_sales ),
		orders_count: safeParseInt( item.orders_count ),
	};
}

function sanitizeCustomerSummary(
	summary: RawCustomersNewReturningSummary
): SanitizedCustomersNewReturningSummary {
	// safeParseFloat/safeParseInt fall back to 0 for missing fields (e.g. an
	// empty-range response), so the widget reaches its empty state instead of
	// charting NaN values.
	return {
		...summary,
		total_net_sales: safeParseFloat( summary.total_net_sales ),
		total_orders: safeParseInt( summary.total_orders ),
		new_customer_sales: safeParseFloat( summary.new_customer_sales ),
		returning_customer_sales: safeParseFloat( summary.returning_customer_sales ),
	};
}

export const sanitizeReportCustomersResponse = (
	response: ReportsCustomersNewReturningResponse
): SanitizedCustomersNewReturningResponse => {
	return {
		summary: sanitizeCustomerSummary( response.summary ),
		data: response.data.map( sanitizeCustomerItem ),
	};
};
