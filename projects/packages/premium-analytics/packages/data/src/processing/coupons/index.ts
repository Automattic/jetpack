/**
 * Internal dependencies
 */
import { fetchReportCoupons } from '../../api/report-coupons-fetch';
import type { Override } from '../../utils/types';

type ReportsCouponsResponse = Awaited< ReturnType< typeof fetchReportCoupons > >;
type RawCouponsDataItem = ReportsCouponsResponse[ 'data' ][ number ];
type RawCouponsDataSummary = ReportsCouponsResponse[ 'summary' ];

/**
 * Processed data item (numbers for calculations)
 */
type SanitizedCouponsDataItem = Override<
	RawCouponsDataItem,
	{
		discount_amount: number;
		total_sales: number;
		orders_count: number;
	}
>;

/**
 * Processed summary (numbers for calculations)
 */
type SanitizedCouponsDataSummary = Override<
	RawCouponsDataSummary,
	{
		total_sales: number;
		total_discount_amount: number;
		total_orders: number;
	}
>;

/**
 * Processed response with numeric values
 */
type SanitizedCouponsResponse = {
	summary: SanitizedCouponsDataSummary;
	data: SanitizedCouponsDataItem[];
};

/**
 * Sanitize/process a single coupon item by converting strings to numbers
 */
function sanitizeCouponItem( item: RawCouponsDataItem ): SanitizedCouponsDataItem {
	return {
		...item,
		discount_amount: parseFloat( item.discount_amount ),
		total_sales: parseFloat( item.total_sales ),
		orders_count: parseInt( item.orders_count, 10 ),
	};
}

/**
 * Sanitize/process summary by converting strings to numbers
 */
function sanitizeCouponSummary( summary: RawCouponsDataSummary ): SanitizedCouponsDataSummary {
	return {
		...summary,
		total_sales: parseFloat( summary.total_sales ),
		total_discount_amount: parseFloat( summary.total_discount_amount ),
		total_orders: parseInt( summary.total_orders, 10 ),
	};
}

/**
 * Sanitize the response from the reports/coupons endpoint
 * Converts string values to numbers for easier calculations and charting.
 */
export const sanitizeReportCouponsResponse = (
	response: ReportsCouponsResponse
): SanitizedCouponsResponse => {
	return {
		summary: sanitizeCouponSummary( response.summary ),
		data: response.data.map( sanitizeCouponItem ),
	};
};
