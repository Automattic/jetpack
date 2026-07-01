/**
 * Internal dependencies
 */
import { fetchReportCustomers } from '../../api/report-customers-fetch';
import type { Override } from '../../utils/types';

type ReportsCustomersNewReturningResponse = Awaited< ReturnType< typeof fetchReportCustomers > >;
type RawCustomersNewReturningSummary = ReportsCustomersNewReturningResponse[ 'summary' ];
type RawCustomersNewReturningItem = ReportsCustomersNewReturningResponse[ 'data' ][ number ];

/**
 * Processed summary (numbers for calculations)
 */
type SanitizedCustomersNewReturningSummary = Override<
	RawCustomersNewReturningSummary,
	{
		total_net_sales: number;
		total_orders: number;
		new_customer_sales: number;
		returning_customer_sales: number;
	}
>;

/**
 * Processed item (numbers for calculations)
 */
type SanitizedCustomersNewReturningItem = Override<
	RawCustomersNewReturningItem,
	{
		net_sales: number;
		orders_count: number;
	}
>;

/**
 * Processed response with numeric values
 */
type SanitizedCustomersNewReturningResponse = {
	summary: SanitizedCustomersNewReturningSummary;
	data: SanitizedCustomersNewReturningItem[];
};

/**
 * Sanitize/process a single customer item by converting strings to numbers
 */
function sanitizeCustomerItem(
	item: RawCustomersNewReturningItem
): SanitizedCustomersNewReturningItem {
	return {
		...item,
		net_sales: parseFloat( item.net_sales ),
		orders_count: parseInt( item.orders_count, 10 ),
	};
}

/**
 * Sanitize/process the summary by converting strings to numbers
 */
function sanitizeCustomerSummary(
	summary: RawCustomersNewReturningSummary
): SanitizedCustomersNewReturningSummary {
	return {
		...summary,
		total_net_sales: parseFloat( summary.total_net_sales ),
		total_orders: parseInt( summary.total_orders, 10 ),
		new_customer_sales: parseFloat( summary.new_customer_sales ),
		returning_customer_sales: parseFloat( summary.returning_customer_sales ),
	};
}

/**
 * Sanitize the response from the reports/customers/new-returning endpoint
 * Converts string values to numbers for easier calculations and charting.
 */
export const sanitizeReportCustomersResponse = (
	response: ReportsCustomersNewReturningResponse
): SanitizedCustomersNewReturningResponse => {
	return {
		summary: sanitizeCustomerSummary( response.summary ),
		data: response.data.map( sanitizeCustomerItem ),
	};
};
