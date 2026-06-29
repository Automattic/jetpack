/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { reportsPath } from '../constants';
import type { BaseReportParams } from '../../utils/types';

type ReportsCustomersByDateSummary = {
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

type CustomersReportDataItem = {
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

type ReportsCustomersByDateResponse = {
	data: CustomersReportDataItem[];
	summary: ReportsCustomersByDateSummary;
};

export type RequestReportCustomersByDateParams = BaseReportParams;

export async function fetchReportCustomersByDate( {
	from,
	to,
	interval,
	date_type,
}: RequestReportCustomersByDateParams ): Promise< ReportsCustomersByDateResponse > {
	const path = addQueryArgs( `${ reportsPath }/customers/by-date`, {
		from,
		to,
		interval,
		date_type,
	} );

	return apiFetch( { path } ) as Promise< ReportsCustomersByDateResponse >;
}
