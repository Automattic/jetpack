/**
 * Internal dependencies
 */
import { fetchReportCouponsByDate } from '../../api/report-coupons-by-date-fetch';
import type { Override } from '../../utils/types';

type ReportsCouponsByDateResponse = Awaited< ReturnType< typeof fetchReportCouponsByDate > >;
type RawSummary = ReportsCouponsByDateResponse[ 'summary' ];
type RawDataItem = ReportsCouponsByDateResponse[ 'data' ][ number ];

/**
 * Processed summary with numeric values.
 */
type SanitizedCouponsByDateSummary = Override<
	RawSummary,
	{
		total_orders: number;
		orders_with_coupon: number;
		orders_without_coupon: number;
		total_sales: number;
		sales_with_coupon: number;
		sales_without_coupon: number;
		total_discount_amount: number;
		net_sales_after_discount: number;
		coupon_usage_percentage: number;
	}
>;

/**
 * Processed data item with numeric values.
 */
type SanitizedCouponsByDateDataItem = Override<
	RawDataItem,
	{
		total_orders: number;
		orders_with_coupon: number;
		orders_without_coupon: number;
		total_sales: number;
		sales_with_coupon: number;
		sales_without_coupon: number;
		total_discount_amount: number;
		net_sales_after_discount: number;
		coupon_usage_percentage: number;
	}
>;

/**
 * Processed response with numeric values.
 */
type SanitizedCouponsByDateResponse = {
	summary: SanitizedCouponsByDateSummary;
	data: SanitizedCouponsByDateDataItem[];
};

function sanitizeItem( item: RawDataItem ): SanitizedCouponsByDateDataItem {
	return {
		...item,
		total_orders: parseInt( item.total_orders, 10 ),
		orders_with_coupon: parseInt( item.orders_with_coupon, 10 ),
		orders_without_coupon: parseInt( item.orders_without_coupon, 10 ),
		total_sales: parseFloat( item.total_sales ),
		sales_with_coupon: parseFloat( item.sales_with_coupon ),
		sales_without_coupon: parseFloat( item.sales_without_coupon ),
		total_discount_amount: parseFloat( item.total_discount_amount ),
		net_sales_after_discount: parseFloat( item.net_sales_after_discount ),
		coupon_usage_percentage: parseFloat( item.coupon_usage_percentage ),
	};
}

function sanitizeSummary( summary: RawSummary ): SanitizedCouponsByDateSummary {
	return {
		...summary,
		total_orders: parseInt( summary.total_orders, 10 ),
		orders_with_coupon: parseInt( summary.orders_with_coupon, 10 ),
		orders_without_coupon: parseInt( summary.orders_without_coupon, 10 ),
		total_sales: parseFloat( summary.total_sales ),
		sales_with_coupon: parseFloat( summary.sales_with_coupon ),
		sales_without_coupon: parseFloat( summary.sales_without_coupon ),
		total_discount_amount: parseFloat( summary.total_discount_amount ),
		net_sales_after_discount: parseFloat( summary.net_sales_after_discount ),
		coupon_usage_percentage: parseFloat( summary.coupon_usage_percentage ),
	};
}

/**
 * Sanitize the response from the reports/coupons/by-date endpoint.
 * Converts string values to numbers for calculations and charting.
 */
export const sanitizeReportCouponsByDateResponse = (
	response: ReportsCouponsByDateResponse
): SanitizedCouponsByDateResponse => {
	return {
		summary: sanitizeSummary( response.summary ),
		data: response.data.map( sanitizeItem ),
	};
};
