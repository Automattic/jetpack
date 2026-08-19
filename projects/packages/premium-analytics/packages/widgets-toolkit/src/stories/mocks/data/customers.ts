/**
 * Mock data for Customers New vs Returning endpoint
 *
 * Used by: RevenueByCustomerTypeWidget, BookingsRevenueByCustomerTypeWidget
 *
 * Response structure matches:
 * - summary: CustomersNewReturningSummary
 * - data: CustomersNewReturningItem[]
 */

export type MockCustomersItem = {
	customer_type: 'new' | 'returning';
	net_sales: string;
	orders_count: string;
};

export type MockCustomersSummary = {
	total_net_sales: string;
	total_orders: string;
	new_customer_sales: string;
	returning_customer_sales: string;
	date_start: string;
	date_end: string;
};

export type MockCustomersResponse = {
	summary: MockCustomersSummary;
	data: MockCustomersItem[];
};

/**
 * Primary period mock data for customers
 */
export const mockCustomersData: MockCustomersResponse = {
	summary: {
		total_net_sales: '87654.32',
		total_orders: '456',
		new_customer_sales: '34567.89',
		returning_customer_sales: '53086.43',
		date_start: '2024-01-01',
		date_end: '2024-01-31',
	},
	data: [
		{
			customer_type: 'returning',
			net_sales: '53086.43',
			orders_count: '267',
		},
		{
			customer_type: 'new',
			net_sales: '34567.89',
			orders_count: '189',
		},
	],
};

/**
 * Comparison period mock data for customers (slightly lower values)
 */
export const mockCustomersComparisonData: MockCustomersResponse = {
	summary: {
		total_net_sales: '72345.67',
		total_orders: '389',
		new_customer_sales: '28901.23',
		returning_customer_sales: '43444.44',
		date_start: '2023-12-01',
		date_end: '2023-12-31',
	},
	data: [
		{
			customer_type: 'returning',
			net_sales: '43444.44',
			orders_count: '221',
		},
		{
			customer_type: 'new',
			net_sales: '28901.23',
			orders_count: '168',
		},
	],
};

/**
 * Empty state mock data
 */
export const mockCustomersEmptyData: MockCustomersResponse = {
	summary: {
		total_net_sales: '0',
		total_orders: '0',
		new_customer_sales: '0',
		returning_customer_sales: '0',
		date_start: '2024-01-01',
		date_end: '2024-01-31',
	},
	data: [],
};

/**
 * Mock data for Customers By Date endpoint
 *
 * Used by: NewVsReturningCustomerWidget
 *
 * Response structure matches:
 * - summary: CustomersByDateSummary (includes customer counts)
 * - data: CustomersByDateItem[]
 */

export type MockCustomersByDateSummary = {
	total_net_sales: string;
	total_gross_sales: string;
	total_discounts: string;
	total_refunds: string;
	total_orders: string;
	total_average_order_value: string;
	total_avg_items_per_order: string;
	total_customers: string;
	new_customers: string;
	returning_customers: string;
	new_customer_sales: string;
	new_customer_gross_sales: string;
	new_customer_discounts: string;
	new_customer_refunds: string;
	new_customer_orders: string;
	new_customer_avg_order_value: string;
	new_customer_avg_items_per_order: string;
	returning_customer_sales: string;
	returning_customer_gross_sales: string;
	returning_customer_discounts: string;
	returning_customer_refunds: string;
	returning_customer_orders: string;
	returning_customer_avg_order_value: string;
	returning_customer_avg_items_per_order: string;
	date_start: string;
	date_end: string;
};

export type MockCustomersByDateItem = {
	time_interval: string;
	date_start: string;
	date_end: string;
	total_customers: string;
	new_customers: string;
	returning_customers: string;
	orders_count: string;
	new_customer_orders: string;
	returning_customer_orders: string;
	net_sales: string;
	new_customer_net_sales: string;
	returning_customer_net_sales: string;
};

export type MockCustomersByDateResponse = {
	summary: MockCustomersByDateSummary;
	data: MockCustomersByDateItem[];
};

/**
 * Primary period mock data for customers by date
 */
export const mockCustomersByDateData: MockCustomersByDateResponse = {
	summary: {
		total_net_sales: '87654.32',
		total_gross_sales: '92000.00',
		total_discounts: '4345.68',
		total_refunds: '0',
		total_orders: '456',
		total_average_order_value: '192.22',
		total_avg_items_per_order: '2.3',
		total_customers: '2000',
		new_customers: '400',
		returning_customers: '1600',
		new_customer_sales: '34567.89',
		new_customer_gross_sales: '36000.00',
		new_customer_discounts: '1432.11',
		new_customer_refunds: '0',
		new_customer_orders: '189',
		new_customer_avg_order_value: '182.90',
		new_customer_avg_items_per_order: '2.1',
		returning_customer_sales: '53086.43',
		returning_customer_gross_sales: '56000.00',
		returning_customer_discounts: '2913.57',
		returning_customer_refunds: '0',
		returning_customer_orders: '267',
		returning_customer_avg_order_value: '198.83',
		returning_customer_avg_items_per_order: '2.5',
		date_start: '2024-01-01',
		date_end: '2024-01-31',
	},
	data: [],
};

/**
 * Comparison period mock data for customers by date (slightly lower values)
 */
export const mockCustomersByDateComparisonData: MockCustomersByDateResponse = {
	summary: {
		total_net_sales: '72345.67',
		total_gross_sales: '76000.00',
		total_discounts: '3654.33',
		total_refunds: '0',
		total_orders: '389',
		total_average_order_value: '185.98',
		total_avg_items_per_order: '2.2',
		total_customers: '1940',
		new_customers: '396',
		returning_customers: '1544',
		new_customer_sales: '28901.23',
		new_customer_gross_sales: '30000.00',
		new_customer_discounts: '1098.77',
		new_customer_refunds: '0',
		new_customer_orders: '168',
		new_customer_avg_order_value: '172.03',
		new_customer_avg_items_per_order: '2.0',
		returning_customer_sales: '43444.44',
		returning_customer_gross_sales: '46000.00',
		returning_customer_discounts: '2555.56',
		returning_customer_refunds: '0',
		returning_customer_orders: '221',
		returning_customer_avg_order_value: '196.58',
		returning_customer_avg_items_per_order: '2.4',
		date_start: '2023-12-01',
		date_end: '2023-12-31',
	},
	data: [],
};
