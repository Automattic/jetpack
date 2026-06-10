/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { reportsPath } from '../constants';
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
	const path = addQueryArgs( `${ reportsPath }/customers/new-returning`, {
		from,
		to,
		filters,
		date_type,
	} );

	return apiFetch( {
		path,
	} ) as Promise< ReportsCustomersNewReturningResponse >;
}
