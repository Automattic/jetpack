/**
 * Internal dependencies
 */
import type { RequestReportBookingsParams } from './report-bookings-fetch';
import type { RequestReportCouponsByDateParams } from './report-coupons-by-date-fetch';
import type { RequestReportCouponsParams } from './report-coupons-fetch';
import type { RequestReportCustomersParams } from './report-customers-fetch';
import type { RequestReportOrderAttributionByProductParams } from './report-order-attribution-by-product-fetch';
import type { RequestReportOrderAttributionSummaryParams } from './report-order-attribution-summary-fetch';
import type { RequestReportOrdersParams } from './report-orders-fetch';
import type { RequestReportProductsParams } from './report-products-fetch';
import type { RequestReportSessionsByDeviceParams } from './report-sessions-by-device-fetch';
import type { RequestReportVisitorsByLocationParams } from './report-visitors-by-location-fetch';
import type { RequestReportVisitorsParams } from './report-visitors-fetch';

export type ReportQueryParams = Partial<
	RequestReportOrdersParams &
		RequestReportOrderAttributionSummaryParams &
		RequestReportOrderAttributionByProductParams &
		RequestReportCouponsParams &
		RequestReportCouponsByDateParams &
		RequestReportCustomersParams &
		RequestReportProductsParams &
		RequestReportVisitorsParams &
		RequestReportVisitorsByLocationParams &
		RequestReportBookingsParams &
		RequestReportSessionsByDeviceParams
>;

export { fetchReportOrders } from './report-orders-fetch';
export {
	fetchReportOrderAttributionSummary,
	ORDER_ATTRIBUTION_VIEWS,
} from './report-order-attribution-summary-fetch';
export { fetchReportOrderAttributionByProduct } from './report-order-attribution-by-product-fetch';
export { fetchReportCoupons } from './report-coupons-fetch';
export { fetchReportCouponsByDate } from './report-coupons-by-date-fetch';
export { fetchReportCustomers } from './report-customers-fetch';
export { fetchReportProducts } from './report-products-fetch';
export { fetchReportVisitors } from './report-visitors-fetch';
export { fetchReportVisitorsByLocation } from './report-visitors-by-location-fetch';
export { fetchReportBookings } from './report-bookings-fetch';
export { fetchReportSessionsByDevice } from './report-sessions-by-device-fetch';
export { exportReport } from './report-export-fetch';
export type { ExportReportParams, ExportReportResponse } from './report-export-fetch';
export {
	fetchStatsProxy,
	getStatsProxyPath,
	type StatsProxyFetchParams,
	type StatsProxyMethod,
	type StatsProxyParams,
	type StatsProxyVersion,
} from './stats-proxy-fetch';
