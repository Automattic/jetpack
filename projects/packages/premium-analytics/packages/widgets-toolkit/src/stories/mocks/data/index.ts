/**
 * Mock Data for Storybook
 *
 * This folder contains mock API responses for widget testing.
 * Each file should export typed mock data matching the API response format.
 *
 * ## Adding New Mocks
 *
 * 1. Create a new file: `{endpoint-name}.ts`
 * 2. Import the response type from `@jetpack-premium-analytics/data` (or use relative path)
 * 3. Export typed mock data
 * 4. Add export here and import in `../register-report-mocks.ts`
 */

export {
	mockOrderAttributionData,
	mockOrderAttributionDeviceData,
	mockOrderAttributionByProductDeviceData,
	mockOrderAttributionByProductDeviceComparisonData,
	mockOrderAttributionChannelData,
	mockOrderAttributionSourceData,
	mockOrderAttributionCampaignData,
} from './order-attribution';

export {
	mockOrdersByProductTypeData,
	mockOrdersByProductTypeComparisonData,
	generateOrdersByProductType,
	seededRandom,
	filterDataByDateRange,
	recalculateSummary,
} from './orders-by-product-type';

export {
	generateBookings,
	filterBookingsDataByDateRange,
	recalculateBookingsSummary,
} from './bookings';

export { buildVisitorsByLocationResponse } from './visitors-by-location';

export {
	mockSessionsByDeviceData,
	mockSessionsByDeviceComparisonData,
	mockSessionsByDeviceEmptyData,
	mockSessionsByDeviceExtremeData,
} from './sessions-by-device';

export {
	mockCouponsData,
	mockCouponsComparisonData,
	mockCouponsEmptyData,
	mockCouponsByDateData,
	mockCouponsByDateComparisonData,
} from './coupons';

export {
	mockCustomersData,
	mockCustomersComparisonData,
	mockCustomersEmptyData,
	mockCustomersByDateData,
	mockCustomersByDateComparisonData,
} from './customers';

export { mockCommentsData } from './comments';
export { mockSearchTermsData, mockSearchTermsComparisonData } from './search-terms';
export { mockSingleVideoData } from './single-video';
export { mockTagsData } from './tags';
export { mockTopAuthorsData, mockTopAuthorsComparisonData } from './top-authors';

export { mockSiteSummary } from './site-summary';

export { mockStatsInsightsData } from './insights';

export { mockStatsSummaryData, mockStatsSummaryComparisonData } from './summary';

export { mockStatsSubscribersCountsData } from './subscriber-counts';

export { mockPlanUsageData, mockPlanUsageOverLimitData } from './plan-usage';

export { buildEmailRateResponse } from './email-rate';

export {
	mockEmailCountryBreakdown,
	mockEmailDeviceBreakdown,
	mockEmailClientBreakdown,
	mockEmailInternalLinkBreakdown,
	mockEmailUserContentLinkBreakdown,
} from './email-breakdown';
