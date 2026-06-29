/**
 * Mock data for order attribution endpoint
 * Used by: SalesByDeviceWidget
 *
 * API format: /jetpack-premium-analytics/v1/proxy/v2/analytics/reports/order-attribution/:view/summary
 * Values are strings (the sanitizer converts them to numbers)
 */
import type { OrderAttributionByProductResponse } from '../../../../../data/src/api/report-order-attribution-by-product-fetch/report-order-attribution-by-product-fetch';
import type { fetchReportOrderAttributionSummary } from '../../../../../data/src/api/report-order-attribution-summary-fetch/report-order-attribution-summary-fetch';

/**
 * Infer the response type from the fetch function.
 * This keeps types in sync without needing explicit exports.
 */
type OrderAttributionSummaryResponse = Awaited<
	ReturnType< typeof fetchReportOrderAttributionSummary >
>;

/**
 * Order Attribution by Device mock data
 *
 * Uses semi-extreme values to test responsive layouts:
 * - Labels with 2-3 words (realistic device names)
 * - Large currency values (hundreds of thousands)
 * - Mixed comparison deltas (positive, negative, small)
 */
export const mockOrderAttributionDeviceData: OrderAttributionSummaryResponse = {
	view: 'device',
	order_by: 'net_sales',
	data: [
		{
			item: 'Desktop Browser',
			current_period: {
				value: '847583.99',
				intervals: [],
			},
			previous_period: {
				value: '692451.25',
				intervals: [],
			},
		},
		{
			item: 'Mobile App',
			current_period: {
				value: '534721.50',
				intervals: [],
			},
			previous_period: {
				value: '645892.75',
				intervals: [],
			},
		},
		{
			item: 'Tablet Safari',
			current_period: {
				value: '158923.75',
				intervals: [],
			},
			previous_period: {
				value: '152850.00',
				intervals: [],
			},
		},
	],
};

/**
 * Order Attribution by Product mock data for booking-filtered device requests.
 *
 * The filtered by-product endpoint returns a flat shape and is normalized by
 * the data package before widgets consume it.
 */
export const mockOrderAttributionByProductDeviceData: OrderAttributionByProductResponse = {
	view: 'device',
	order_by: 'net_sales',
	data: [
		{
			item: 'Desktop Browser',
			value: '52842.10',
			intervals: [],
		},
		{
			item: 'Mobile App',
			value: '41795.50',
			intervals: [],
		},
		{
			item: 'Tablet Safari',
			value: '16240.75',
			intervals: [],
		},
	],
};

export const mockOrderAttributionByProductDeviceComparisonData: OrderAttributionByProductResponse =
	{
		view: 'device',
		order_by: 'net_sales',
		data: [
			{
				item: 'Desktop Browser',
				value: '47182.40',
				intervals: [],
			},
			{
				item: 'Mobile App',
				value: '44320.20',
				intervals: [],
			},
			{
				item: 'Tablet Safari',
				value: '13780.50',
				intervals: [],
			},
		],
	};

/**
 * Order Attribution by Channel mock data
 */
export const mockOrderAttributionChannelData: OrderAttributionSummaryResponse = {
	view: 'channel',
	order_by: 'net_sales',
	data: [
		{
			item: 'Organic Search',
			current_period: {
				value: '9832.20',
				intervals: [],
			},
			previous_period: {
				value: '8500.00',
				intervals: [],
			},
		},
		{
			item: 'Direct',
			current_period: {
				value: '7374.15',
				intervals: [],
			},
			previous_period: {
				value: '6200.00',
				intervals: [],
			},
		},
		{
			item: 'Paid Search',
			current_period: {
				value: '4916.10',
				intervals: [],
			},
			previous_period: {
				value: '4100.00',
				intervals: [],
			},
		},
		{
			item: 'Social',
			current_period: {
				value: '2458.05',
				intervals: [],
			},
			previous_period: {
				value: '2000.00',
				intervals: [],
			},
		},
	],
};

/**
 * Order Attribution by Source mock data
 */
export const mockOrderAttributionSourceData: OrderAttributionSummaryResponse = {
	view: 'source',
	order_by: 'net_sales',
	data: [
		{
			item: 'google',
			current_period: {
				value: '12000.00',
				intervals: [],
			},
			previous_period: {
				value: '10500.00',
				intervals: [],
			},
		},
		{
			item: 'facebook',
			current_period: {
				value: '5500.00',
				intervals: [],
			},
			previous_period: {
				value: '4800.00',
				intervals: [],
			},
		},
		{
			item: 'instagram',
			current_period: {
				value: '3200.00',
				intervals: [],
			},
			previous_period: {
				value: '2900.00',
				intervals: [],
			},
		},
	],
};

/**
 * Order Attribution by Campaign mock data
 */
export const mockOrderAttributionCampaignData: OrderAttributionSummaryResponse = {
	view: 'campaign',
	order_by: 'net_sales',
	data: [
		{
			item: 'Black Friday 2024',
			current_period: {
				value: '45200.00',
				intervals: [],
			},
			previous_period: {
				value: '38500.00',
				intervals: [],
			},
		},
		{
			item: 'Summer Sale',
			current_period: {
				value: '28750.00',
				intervals: [],
			},
			previous_period: {
				value: '31200.00',
				intervals: [],
			},
		},
		{
			item: 'New Year Promo',
			current_period: {
				value: '15800.00',
				intervals: [],
			},
			previous_period: {
				value: '12400.00',
				intervals: [],
			},
		},
		{
			item: 'Newsletter Exclusive',
			current_period: {
				value: '8900.00',
				intervals: [],
			},
			previous_period: {
				value: '7650.00',
				intervals: [],
			},
		},
	],
};

// Legacy export for backwards compatibility
export const mockOrderAttributionData = mockOrderAttributionDeviceData;
