/**
 * Internal dependencies
 */
import { fetchReport } from '../stats-proxy-fetch';
import type { FilterCondition } from '../../types/filter-condition';
import type { BaseReportParams } from '../../utils/types';

type CouponsDataItem = {
	coupon_code: string;
	discount_amount: string;
	total_sales: string;
	orders_count: string;
};

type CouponsDataSummary = {
	total_sales: string;
	total_discount_amount: string;
	total_orders: string;
	date_start: string;
	date_end: string;
};

export type ReportsCouponsResponse = {
	summary: CouponsDataSummary;
	data: CouponsDataItem[];
};

export type RequestReportCouponsParams = BaseReportParams & {
	filters?: FilterCondition[];
};

export async function fetchReportCoupons( {
	from,
	to,
	interval,
	filters,
	date_type,
}: RequestReportCouponsParams ): Promise< ReportsCouponsResponse > {
	return fetchReport< ReportsCouponsResponse >( 'coupons/', {
		from,
		to,
		interval,
		filters,
		date_type,
		orderby: 'total_sales',
	} );
}
