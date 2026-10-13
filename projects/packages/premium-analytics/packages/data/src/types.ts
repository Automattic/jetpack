/**
 * Internal dependencies
 */
import { sanitizeReportOrdersResponse, sanitizeReportProductsResponse } from './processing';
import { sanitizeReportBookingsResponse } from './processing/bookings';
import { sanitizeReportConversionRateResponse } from './processing/conversion-rate';
import { sanitizeReportCouponsResponse } from './processing/coupons';
import { sanitizeReportCouponsByDateResponse } from './processing/coupons-by-date';
import { sanitizeReportCustomersResponse } from './processing/customers';
import { sanitizeReportCustomersByDateResponse } from './processing/customers-by-date';
import { sanitizeReportOrderAttributionSummaryResponse } from './processing/order-attribution';
import { sanitizeReportOrdersByProductTypeResponse } from './processing/orders-by-product-type';
import { sanitizeReportSessionsByDeviceResponse } from './processing/sessions-by-device';
import { sanitizeReportVisitorsResponse } from './processing/visitors';
import { sanitizeReportVisitorsByLocationResponse } from './processing/visitors-by-location';
import type { ReportParams } from './utils/search';

export type ReportType =
	| 'orders'
	| 'orders-by-product-type'
	| 'order-attribution'
	| 'coupons'
	| 'couponsByDate'
	| 'customers'
	| 'customersByDate'
	| 'products'
	| 'visitors'
	| 'visitorsByLocation'
	| 'conversionRate'
	| 'bookings'
	| 'sessionsByDevice';

export type QueryParams = ReportParams & {
	p?: string; // encoded pathname
};

type SanitizedOrdersByDateResponse = ReturnType< typeof sanitizeReportOrdersResponse >;

type SanitizedOrderAttributionSummaryResponse = ReturnType<
	typeof sanitizeReportOrderAttributionSummaryResponse
>;

type SanitizedCouponsResponse = ReturnType< typeof sanitizeReportCouponsResponse >;

type SanitizedCouponsByDateResponse = ReturnType< typeof sanitizeReportCouponsByDateResponse >;

type SanitizedCustomersResponse = ReturnType< typeof sanitizeReportCustomersResponse >;

type SanitizedCustomersByDateResponse = ReturnType< typeof sanitizeReportCustomersByDateResponse >;

type SanitizedProductsResponse = ReturnType< typeof sanitizeReportProductsResponse >;

type SanitizedVisitorsResponse = ReturnType< typeof sanitizeReportVisitorsResponse >;

type SanitizedVisitorsByLocationResponse = ReturnType<
	typeof sanitizeReportVisitorsByLocationResponse
>;

type SanitizedConversionRateResponse = ReturnType< typeof sanitizeReportConversionRateResponse >;

type SanitizedOrdersByProductTypeResponse = ReturnType<
	typeof sanitizeReportOrdersByProductTypeResponse
>;

type SanitizedBookingsResponse = ReturnType< typeof sanitizeReportBookingsResponse >;

type SanitizedSessionsByDeviceResponse = ReturnType<
	typeof sanitizeReportSessionsByDeviceResponse
>;

// Report type to its *processed* data structure: the numeric strings the API returns
// have already been coerced to numbers.
export interface ReportDataMap {
	orders: SanitizedOrdersByDateResponse;
	'orders-by-product-type': SanitizedOrdersByProductTypeResponse;
	'order-attribution': SanitizedOrderAttributionSummaryResponse;
	coupons: SanitizedCouponsResponse;
	couponsByDate: SanitizedCouponsByDateResponse;
	customers: SanitizedCustomersResponse;
	customersByDate: SanitizedCustomersByDateResponse;
	products: SanitizedProductsResponse;
	visitors: SanitizedVisitorsResponse;
	visitorsByLocation: SanitizedVisitorsByLocationResponse;
	conversionRate: SanitizedConversionRateResponse;
	bookings: SanitizedBookingsResponse;
	sessionsByDevice: SanitizedSessionsByDeviceResponse;
}
