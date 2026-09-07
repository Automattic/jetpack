/**
 * Internal dependencies
 */
import { fetchReport } from '../stats-proxy-fetch';
import type { FilterCondition } from '../../types/filter-condition';
import type { BaseReportParams } from '../../utils/types';

type CustomersNewReturningSummary = {
	total_net_sales: string;
	total_orders: string;
	new_customer_sales: string;
	returning_customer_sales: string;
	date_start: string;
	date_end: string;
};

type CustomersNewReturningItem = {
	customer_type: 'new' | 'returning';
	net_sales: string;
	orders_count: string;
};

type ReportsCustomersNewReturningResponse = {
	summary: CustomersNewReturningSummary;
	data: CustomersNewReturningItem[];
};

export type RequestReportCustomersParams = Omit< BaseReportParams, 'interval' > & {
	filters?: FilterCondition[];
};

export async function fetchReportCustomers( {
	from,
	to,
	filters,
	date_type,
}: RequestReportCustomersParams ): Promise< ReportsCustomersNewReturningResponse > {
	return fetchReport< ReportsCustomersNewReturningResponse >( 'customers/new-returning', {
		from,
		to,
		filters,
		date_type,
	} );
}
