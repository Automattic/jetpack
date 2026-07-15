/**
 * Internal dependencies
 */
import { fetchReportCouponsByDate } from '../../api/report-coupons-by-date-fetch';
import { safeParseFloat, safeParseInt } from '../../utils/parsing';
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
		total_orders: safeParseInt( item.total_orders ),
		orders_with_coupon: safeParseInt( item.orders_with_coupon ),
		orders_without_coupon: safeParseInt( item.orders_without_coupon ),
		total_sales: safeParseFloat( item.total_sales ),
		sales_with_coupon: safeParseFloat( item.sales_with_coupon ),
		sales_without_coupon: safeParseFloat( item.sales_without_coupon ),
		total_discount_amount: safeParseFloat( item.total_discount_amount ),
		net_sales_after_discount: safeParseFloat( item.net_sales_after_discount ),
		coupon_usage_percentage: safeParseFloat( item.coupon_usage_percentage ),
	};
}

function sanitizeSummary( summary: RawSummary ): SanitizedCouponsByDateSummary {
	// safeParseFloat/safeParseInt fall back to 0 for missing fields (e.g. an
	// empty-range response with an empty `summary`), so the widget reaches its
	// empty state instead of charting NaN values.
	return {
		...summary,
		total_orders: safeParseInt( summary.total_orders ),
		orders_with_coupon: safeParseInt( summary.orders_with_coupon ),
		orders_without_coupon: safeParseInt( summary.orders_without_coupon ),
		total_sales: safeParseFloat( summary.total_sales ),
		sales_with_coupon: safeParseFloat( summary.sales_with_coupon ),
		sales_without_coupon: safeParseFloat( summary.sales_without_coupon ),
		total_discount_amount: safeParseFloat( summary.total_discount_amount ),
		net_sales_after_discount: safeParseFloat( summary.net_sales_after_discount ),
		coupon_usage_percentage: safeParseFloat( summary.coupon_usage_percentage ),
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
