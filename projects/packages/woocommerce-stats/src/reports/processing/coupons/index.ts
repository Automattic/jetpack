/**
 * Internal dependencies
 */
import { fetchReportCoupons } from '../../api/report-coupons-fetch';
import type { Override } from '../../utils/types';

type ReportsCouponsResponse = Awaited< ReturnType< typeof fetchReportCoupons > >;
type RawCouponsDataItem = ReportsCouponsResponse[ 'data' ][ number ];
type RawCouponsDataSummary = ReportsCouponsResponse[ 'summary' ];

type SanitizedCouponsDataItem = Override<
	RawCouponsDataItem,
	{
		discount_amount: number;
		total_sales: number;
		orders_count: number;
	}
>;

type SanitizedCouponsDataSummary = Override<
	RawCouponsDataSummary,
	{
		total_sales: number;
		total_discount_amount: number;
		total_orders: number;
	}
>;

type SanitizedCouponsResponse = {
	summary: SanitizedCouponsDataSummary;
	data: SanitizedCouponsDataItem[];
};

function sanitizeCouponItem( item: RawCouponsDataItem ): SanitizedCouponsDataItem {
	return {
		...item,
		discount_amount: parseFloat( item.discount_amount ),
		total_sales: parseFloat( item.total_sales ),
		orders_count: parseInt( item.orders_count, 10 ),
	};
}

function sanitizeCouponSummary( summary: RawCouponsDataSummary ): SanitizedCouponsDataSummary {
	return {
		...summary,
		total_sales: parseFloat( summary.total_sales ),
		total_discount_amount: parseFloat( summary.total_discount_amount ),
		total_orders: parseInt( summary.total_orders, 10 ),
	};
}

export const sanitizeReportCouponsResponse = (
	response: ReportsCouponsResponse
): SanitizedCouponsResponse => {
	return {
		summary: sanitizeCouponSummary( response.summary ),
		data: response.data.map( sanitizeCouponItem ),
	};
};
