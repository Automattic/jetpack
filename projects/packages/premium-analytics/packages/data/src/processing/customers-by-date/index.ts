/**
 * Internal dependencies
 */
import { fetchReportCustomersByDate } from '../../api/report-customers-by-date-fetch';
import { safeParseFloat, safeParseInt } from '../../utils/parsing';
import type { Override } from '../../utils/types';

type ReportsCustomersByDateResponse = Awaited< ReturnType< typeof fetchReportCustomersByDate > >;
type RawCustomersByDateSummary = ReportsCustomersByDateResponse[ 'summary' ];
type RawCustomersByDateItem = ReportsCustomersByDateResponse[ 'data' ][ number ];

/**
 * Processed summary (numbers for calculations)
 */
type SanitizedCustomersByDateSummary = Override<
	RawCustomersByDateSummary,
	{
		total_net_sales: number;
		total_gross_sales: number;
		total_discounts: number;
		total_refunds: number;
		total_orders: number;
		total_average_order_value: number;
		total_avg_items_per_order: number;
		total_customers: number;
		new_customers: number;
		returning_customers: number;
		new_customer_sales: number;
		new_customer_gross_sales: number;
		new_customer_discounts: number;
		new_customer_refunds: number;
		new_customer_orders: number;
		new_customer_avg_order_value: number;
		new_customer_avg_items_per_order: number;
		returning_customer_sales: number;
		returning_customer_gross_sales: number;
		returning_customer_discounts: number;
		returning_customer_refunds: number;
		returning_customer_orders: number;
		returning_customer_avg_order_value: number;
		returning_customer_avg_items_per_order: number;
		// Add computed field for compatibility
		customers: number;
	}
>;

/**
 * Processed item (numbers for calculations)
 */
type SanitizedCustomersByDateItem = Override<
	RawCustomersByDateItem,
	{
		total_customers: number;
		new_customers: number;
		returning_customers: number;
		orders_count: number;
		new_customer_orders: number;
		returning_customer_orders: number;
		net_sales: number;
		new_customer_net_sales: number;
		returning_customer_net_sales: number;
		// Add computed field for compatibility
		customers: number;
	}
>;

/**
 * Processed response with numeric values
 */
export type SanitizedCustomersByDateResponse = {
	summary: SanitizedCustomersByDateSummary;
	data: SanitizedCustomersByDateItem[];
};

/**
 * Sanitize/process a single customer item by converting strings to numbers
 */
function sanitizeCustomerByDateItem( item: RawCustomersByDateItem ): SanitizedCustomersByDateItem {
	const totalCustomers = safeParseInt( item.total_customers );
	return {
		...item,
		total_customers: totalCustomers,
		new_customers: safeParseInt( item.new_customers ),
		returning_customers: safeParseInt( item.returning_customers ),
		orders_count: safeParseInt( item.orders_count ),
		new_customer_orders: safeParseInt( item.new_customer_orders ),
		returning_customer_orders: safeParseInt( item.returning_customer_orders ),
		net_sales: safeParseFloat( item.net_sales ),
		new_customer_net_sales: safeParseFloat( item.new_customer_net_sales ),
		returning_customer_net_sales: safeParseFloat( item.returning_customer_net_sales ),
		// Add alias for compatibility with chart builder
		customers: totalCustomers,
	};
}

/**
 * Sanitize/process the summary by converting strings to numbers
 */
function sanitizeCustomerByDateSummary(
	summary: RawCustomersByDateSummary
): SanitizedCustomersByDateSummary {
	// safeParseFloat/safeParseInt fall back to 0 for missing fields (e.g. an
	// empty-range response with an empty `summary`), so the widget reaches its
	// empty state instead of charting NaN values.
	const totalCustomers = safeParseInt( summary.total_customers );
	return {
		...summary,
		total_net_sales: safeParseFloat( summary.total_net_sales ),
		total_gross_sales: safeParseFloat( summary.total_gross_sales ),
		total_discounts: safeParseFloat( summary.total_discounts ),
		total_refunds: safeParseFloat( summary.total_refunds ),
		total_orders: safeParseInt( summary.total_orders ),
		total_average_order_value: safeParseFloat( summary.total_average_order_value ),
		total_avg_items_per_order: safeParseFloat( summary.total_avg_items_per_order ),
		total_customers: totalCustomers,
		new_customers: safeParseInt( summary.new_customers ),
		returning_customers: safeParseInt( summary.returning_customers ),
		new_customer_sales: safeParseFloat( summary.new_customer_sales ),
		new_customer_gross_sales: safeParseFloat( summary.new_customer_gross_sales ),
		new_customer_discounts: safeParseFloat( summary.new_customer_discounts ),
		new_customer_refunds: safeParseFloat( summary.new_customer_refunds ),
		new_customer_orders: safeParseInt( summary.new_customer_orders ),
		new_customer_avg_order_value: safeParseFloat( summary.new_customer_avg_order_value ),
		new_customer_avg_items_per_order: safeParseFloat( summary.new_customer_avg_items_per_order ),
		returning_customer_sales: safeParseFloat( summary.returning_customer_sales ),
		returning_customer_gross_sales: safeParseFloat( summary.returning_customer_gross_sales ),
		returning_customer_discounts: safeParseFloat( summary.returning_customer_discounts ),
		returning_customer_refunds: safeParseFloat( summary.returning_customer_refunds ),
		returning_customer_orders: safeParseInt( summary.returning_customer_orders ),
		returning_customer_avg_order_value: safeParseFloat(
			summary.returning_customer_avg_order_value
		),
		returning_customer_avg_items_per_order: safeParseFloat(
			summary.returning_customer_avg_items_per_order
		),
		// Add alias for compatibility with chart builder
		customers: totalCustomers,
	};
}

/**
 * Sanitize the response from the reports/customers/by-date endpoint
 * Converts string values to numbers for easier calculations and charting.
 */
export const sanitizeReportCustomersByDateResponse = (
	response: ReportsCustomersByDateResponse
): SanitizedCustomersByDateResponse => {
	return {
		summary: sanitizeCustomerByDateSummary( response.summary ),
		data: response.data.map( sanitizeCustomerByDateItem ),
	};
};
