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

type CouponsByDateDataItem = {
	time_interval: string;
	date_start: string;
	date_end: string;
	total_orders: string;
	orders_with_coupon: string;
	orders_without_coupon: string;
	total_sales: string;
	sales_with_coupon: string;
	sales_without_coupon: string;
	total_discount_amount: string;
	net_sales_after_discount: string;
	coupon_usage_percentage: string;
};

type CouponsByDateSummary = {
	total_orders: string;
	orders_with_coupon: string;
	orders_without_coupon: string;
	total_sales: string;
	sales_with_coupon: string;
	sales_without_coupon: string;
	total_discount_amount: string;
	net_sales_after_discount: string;
	coupon_usage_percentage: string;
	date_start: string;
	date_end: string;
};

export type ReportsCouponsByDateResponse = {
	summary: CouponsByDateSummary;
	data: CouponsByDateDataItem[];
};

export type RequestReportCouponsByDateParams = BaseReportParams & {
	filters?: FilterCondition[];
};

export async function fetchReportCouponsByDate( {
	from,
	to,
	interval,
	filters,
	date_type,
}: RequestReportCouponsByDateParams ): Promise< ReportsCouponsByDateResponse > {
	const path = addQueryArgs( `${ reportsPath }/coupons/by-date`, {
		from,
		to,
		interval,
		filters,
		date_type,
	} );

	return apiFetch< ReportsCouponsByDateResponse >( { path } );
}
