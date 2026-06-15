/**
 * Internal dependencies
 */
import { fetchReportCustomersByDate } from '../../api/report-customers-by-date-fetch';
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
	const totalCustomers = parseInt( item.total_customers, 10 );
	return {
		...item,
		total_customers: totalCustomers,
		new_customers: parseInt( item.new_customers, 10 ),
		returning_customers: parseInt( item.returning_customers, 10 ),
		orders_count: parseInt( item.orders_count, 10 ),
		new_customer_orders: parseInt( item.new_customer_orders, 10 ),
		returning_customer_orders: parseInt( item.returning_customer_orders, 10 ),
		net_sales: parseFloat( item.net_sales ),
		new_customer_net_sales: parseFloat( item.new_customer_net_sales ),
		returning_customer_net_sales: parseFloat( item.returning_customer_net_sales ),
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
	const totalCustomers = parseInt( summary.total_customers, 10 );
	return {
		...summary,
		total_net_sales: parseFloat( summary.total_net_sales ),
		total_gross_sales: parseFloat( summary.total_gross_sales ),
		total_discounts: parseFloat( summary.total_discounts ),
		total_refunds: parseFloat( summary.total_refunds ),
		total_orders: parseInt( summary.total_orders, 10 ),
		total_average_order_value: parseFloat( summary.total_average_order_value ),
		total_avg_items_per_order: parseFloat( summary.total_avg_items_per_order ),
		total_customers: totalCustomers,
		new_customers: parseInt( summary.new_customers, 10 ),
		returning_customers: parseInt( summary.returning_customers, 10 ),
		new_customer_sales: parseFloat( summary.new_customer_sales ),
		new_customer_gross_sales: parseFloat( summary.new_customer_gross_sales ),
		new_customer_discounts: parseFloat( summary.new_customer_discounts ),
		new_customer_refunds: parseFloat( summary.new_customer_refunds ),
		new_customer_orders: parseInt( summary.new_customer_orders, 10 ),
		new_customer_avg_order_value: parseFloat( summary.new_customer_avg_order_value ),
		new_customer_avg_items_per_order: parseFloat( summary.new_customer_avg_items_per_order ),
		returning_customer_sales: parseFloat( summary.returning_customer_sales ),
		returning_customer_gross_sales: parseFloat( summary.returning_customer_gross_sales ),
		returning_customer_discounts: parseFloat( summary.returning_customer_discounts ),
		returning_customer_refunds: parseFloat( summary.returning_customer_refunds ),
		returning_customer_orders: parseInt( summary.returning_customer_orders, 10 ),
		returning_customer_avg_order_value: parseFloat( summary.returning_customer_avg_order_value ),
		returning_customer_avg_items_per_order: parseFloat(
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
