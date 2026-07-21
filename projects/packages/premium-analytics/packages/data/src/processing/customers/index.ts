/**
 * Internal dependencies
 */
import { fetchReportCustomers } from '../../api/report-customers-fetch';
import { safeParseFloat, safeParseInt } from '../../utils/parsing';
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
		net_sales: safeParseFloat( item.net_sales ),
		orders_count: safeParseInt( item.orders_count ),
	};
}

/**
 * Sanitize/process the summary by converting strings to numbers
 */
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
