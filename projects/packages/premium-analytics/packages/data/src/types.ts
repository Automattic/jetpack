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

// Inferred from processing/orders.ts
type SanitizedOrdersByDateResponse = ReturnType< typeof sanitizeReportOrdersResponse >;

// Inferred from processing/order-attribution.ts
type SanitizedOrderAttributionSummaryResponse = ReturnType<
	typeof sanitizeReportOrderAttributionSummaryResponse
>;

// Inferred from processing/coupons.ts
type SanitizedCouponsResponse = ReturnType< typeof sanitizeReportCouponsResponse >;

// Inferred from processing/coupons-by-date/index.ts
type SanitizedCouponsByDateResponse = ReturnType< typeof sanitizeReportCouponsByDateResponse >;

// Inferred from processing/customers.ts
type SanitizedCustomersResponse = ReturnType< typeof sanitizeReportCustomersResponse >;

// Inferred from processing/customers-by-date/index.ts
type SanitizedCustomersByDateResponse = ReturnType< typeof sanitizeReportCustomersByDateResponse >;

// Inferred from processing/products.ts
type SanitizedProductsResponse = ReturnType< typeof sanitizeReportProductsResponse >;

// Inferred from processing/visitors.ts
type SanitizedVisitorsResponse = ReturnType< typeof sanitizeReportVisitorsResponse >;

// Inferred from processing/visitors-by-location.ts
type SanitizedVisitorsByLocationResponse = ReturnType<
	typeof sanitizeReportVisitorsByLocationResponse
>;

// Inferred from processing/conversion-rate.ts
type SanitizedConversionRateResponse = ReturnType< typeof sanitizeReportConversionRateResponse >;

// Inferred from processing/orders-by-product-type.ts
type SanitizedOrdersByProductTypeResponse = ReturnType<
	typeof sanitizeReportOrdersByProductTypeResponse
>;

// Inferred from processing/bookings.ts
type SanitizedBookingsResponse = ReturnType< typeof sanitizeReportBookingsResponse >;

// Inferred from processing/sessions-by-device.ts
type SanitizedSessionsByDeviceResponse = ReturnType<
	typeof sanitizeReportSessionsByDeviceResponse
>;

// Type mapping for report types to their PROCESSED data structures
export interface ReportDataMap {
	orders: SanitizedOrdersByDateResponse; // Returns processed data with numbers
	'orders-by-product-type': SanitizedOrdersByProductTypeResponse; // Returns processed orders by product type data with numbers
	'order-attribution': SanitizedOrderAttributionSummaryResponse; // Returns processed attribution data
	coupons: SanitizedCouponsResponse; // Returns processed coupons data with numbers
	couponsByDate: SanitizedCouponsByDateResponse; // Returns processed coupons-by-date data with numbers
	customers: SanitizedCustomersResponse; // Returns processed customers data with numbers
	customersByDate: SanitizedCustomersByDateResponse; // Returns processed customers by date data with numbers
	products: SanitizedProductsResponse; // Returns raw products data
	visitors: SanitizedVisitorsResponse; // Returns processed visitors data with numbers
	visitorsByLocation: SanitizedVisitorsByLocationResponse; // Returns processed visitors grouped by location (country or region)
	conversionRate: SanitizedConversionRateResponse; // Returns processed conversion rate data with numbers
	bookings: SanitizedBookingsResponse; // Returns processed bookings data with numbers
	sessionsByDevice: SanitizedSessionsByDeviceResponse; // Returns processed sessions by device data with numbers
}
