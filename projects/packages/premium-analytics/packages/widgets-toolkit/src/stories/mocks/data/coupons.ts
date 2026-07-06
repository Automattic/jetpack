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

export type MockCouponsByDateItem = {
	time_interval: string;
	date_start: string;
	date_end: string;
	total_orders: string;
	orders_with_coupon: string;
	orders_without_coupon: string;
	total_sales: string;
	sales_with_coupon: string;
	sales_without_coupon: string;
	total_discount_amount: string;
	net_sales_after_discount: string;
	coupon_usage_percentage: string;
};

export type MockCouponsByDateSummary = Omit< MockCouponsByDateItem, 'time_interval' >;

export type MockCouponsByDateResponse = {
	summary: MockCouponsByDateSummary;
	data: MockCouponsByDateItem[];
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
 * Primary period mock data for coupons/by-date.
 */
export const mockCouponsByDateData: MockCouponsByDateResponse = {
	summary: {
		total_orders: '234',
		orders_with_coupon: '95',
		orders_without_coupon: '139',
		total_sales: '45678.90',
		sales_with_coupon: '17840.50',
		sales_without_coupon: '27838.40',
		total_discount_amount: '3456.78',
		net_sales_after_discount: '42222.12',
		coupon_usage_percentage: '40.60',
		date_start: '2024-01-01',
		date_end: '2024-01-31',
	},
	data: [
		{
			time_interval: '2024-01-01',
			date_start: '2024-01-01',
			date_end: '2024-01-10',
			total_orders: '78',
			orders_with_coupon: '31',
			orders_without_coupon: '47',
			total_sales: '14980.25',
			sales_with_coupon: '5640.75',
			sales_without_coupon: '9339.50',
			total_discount_amount: '1098.20',
			net_sales_after_discount: '13882.05',
			coupon_usage_percentage: '39.74',
		},
		{
			time_interval: '2024-01-11',
			date_start: '2024-01-11',
			date_end: '2024-01-20',
			total_orders: '81',
			orders_with_coupon: '34',
			orders_without_coupon: '47',
			total_sales: '15876.35',
			sales_with_coupon: '6250.40',
			sales_without_coupon: '9625.95',
			total_discount_amount: '1210.75',
			net_sales_after_discount: '14665.60',
			coupon_usage_percentage: '41.98',
		},
		{
			time_interval: '2024-01-21',
			date_start: '2024-01-21',
			date_end: '2024-01-31',
			total_orders: '75',
			orders_with_coupon: '30',
			orders_without_coupon: '45',
			total_sales: '14822.30',
			sales_with_coupon: '5949.35',
			sales_without_coupon: '8872.95',
			total_discount_amount: '1147.83',
			net_sales_after_discount: '13674.47',
			coupon_usage_percentage: '40.00',
		},
	],
};

/**
 * Comparison period mock data for coupons/by-date.
 */
export const mockCouponsByDateComparisonData: MockCouponsByDateResponse = {
	summary: {
		total_orders: '198',
		orders_with_coupon: '76',
		orders_without_coupon: '122',
		total_sales: '38765.40',
		sales_with_coupon: '14220.15',
		sales_without_coupon: '24545.25',
		total_discount_amount: '2890.12',
		net_sales_after_discount: '35875.28',
		coupon_usage_percentage: '38.38',
		date_start: '2023-12-01',
		date_end: '2023-12-31',
	},
	data: [
		{
			time_interval: '2023-12-01',
			date_start: '2023-12-01',
			date_end: '2023-12-10',
			total_orders: '64',
			orders_with_coupon: '25',
			orders_without_coupon: '39',
			total_sales: '12675.20',
			sales_with_coupon: '4720.50',
			sales_without_coupon: '7954.70',
			total_discount_amount: '948.35',
			net_sales_after_discount: '11726.85',
			coupon_usage_percentage: '39.06',
		},
		{
			time_interval: '2023-12-11',
			date_start: '2023-12-11',
			date_end: '2023-12-20',
			total_orders: '68',
			orders_with_coupon: '26',
			orders_without_coupon: '42',
			total_sales: '13104.90',
			sales_with_coupon: '4811.25',
			sales_without_coupon: '8293.65',
			total_discount_amount: '960.41',
			net_sales_after_discount: '12144.49',
			coupon_usage_percentage: '38.24',
		},
		{
			time_interval: '2023-12-21',
			date_start: '2023-12-21',
			date_end: '2023-12-31',
			total_orders: '66',
			orders_with_coupon: '25',
			orders_without_coupon: '41',
			total_sales: '12985.30',
			sales_with_coupon: '4688.40',
			sales_without_coupon: '8296.90',
			total_discount_amount: '981.36',
			net_sales_after_discount: '12003.94',
			coupon_usage_percentage: '37.88',
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
