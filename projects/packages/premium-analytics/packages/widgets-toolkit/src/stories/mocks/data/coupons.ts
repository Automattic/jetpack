/**
 * Mock data for Coupons endpoint
 *
 * Used by: SalesByCouponWidget
 *
 * Response structure matches:
 * - summary: CouponsDataSummary
 * - data: CouponsDataItem[]
 */

export type MockCouponsItem = {
	coupon_code: string;
	discount_amount: string;
	total_sales: string;
	orders_count: string;
};

export type MockCouponsSummary = {
	total_sales: string;
	total_discount_amount: string;
	total_orders: string;
	date_start: string;
	date_end: string;
};

export type MockCouponsResponse = {
	summary: MockCouponsSummary;
	data: MockCouponsItem[];
};

/**
 * Primary period mock data for coupons
 */
export const mockCouponsData: MockCouponsResponse = {
	summary: {
		total_sales: '45678.90',
		total_discount_amount: '3456.78',
		total_orders: '234',
		date_start: '2024-01-01',
		date_end: '2024-01-31',
	},
	data: [
		{
			coupon_code: 'SUMMER25',
			discount_amount: '1234.56',
			total_sales: '15678.90',
			orders_count: '89',
		},
		{
			coupon_code: 'WELCOME10',
			discount_amount: '987.65',
			total_sales: '12345.67',
			orders_count: '67',
		},
		{
			coupon_code: 'FLASH50',
			discount_amount: '756.43',
			total_sales: '9876.54',
			orders_count: '45',
		},
		{
			coupon_code: 'LOYALTY15',
			discount_amount: '478.14',
			total_sales: '7777.79',
			orders_count: '33',
		},
	],
};

/**
 * Comparison period mock data for coupons (slightly lower values)
 */
export const mockCouponsComparisonData: MockCouponsResponse = {
	summary: {
		total_sales: '38765.40',
		total_discount_amount: '2890.12',
		total_orders: '198',
		date_start: '2023-12-01',
		date_end: '2023-12-31',
	},
	data: [
		{
			coupon_code: 'SUMMER25',
			discount_amount: '1012.34',
			total_sales: '13456.78',
			orders_count: '72',
		},
		{
			coupon_code: 'WELCOME10',
			discount_amount: '823.45',
			total_sales: '10234.56',
			orders_count: '54',
		},
		{
			coupon_code: 'FLASH50',
			discount_amount: '623.21',
			total_sales: '8234.56',
			orders_count: '38',
		},
		{
			coupon_code: 'LOYALTY15',
			discount_amount: '431.12',
			total_sales: '6839.50',
			orders_count: '34',
		},
	],
};

/**
 * Empty state mock data
 */
export const mockCouponsEmptyData: MockCouponsResponse = {
	summary: {
		total_sales: '0',
		total_discount_amount: '0',
		total_orders: '0',
		date_start: '2024-01-01',
		date_end: '2024-01-31',
	},
	data: [],
};
