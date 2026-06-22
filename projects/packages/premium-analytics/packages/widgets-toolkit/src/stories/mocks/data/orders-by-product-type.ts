/**
 * Mock data generator for orders-by-product-type endpoint
 * Used by: BookingOrderMetricWidget, future product-filtered widgets
 *
 * API endpoint: /jetpack-premium-analytics/v1/proxy/v2/analytics/reports/orders-by-product-type/by-date
 * Called when: Product type filters are present (bookings, simple products, etc.)
 *
 * This module provides dynamic fixture generation based on request parameters.
 */
import type { fetchReportOrders } from '../../../../../data/src/api/report-orders-fetch/report-orders-fetch';

/**
 * Infer the response type from the fetch function.
 * This keeps types in sync without needing explicit exports.
 */
type OrdersReportResponse = Awaited< ReturnType< typeof fetchReportOrders > >;

interface GenerateOrdersParams {
	from: string; // ISO date string
	to: string; // ISO date string
	interval?: 'day' | 'week' | 'month';
	/**
	 * Optional seed for reproducible random data.
	 * If not provided, generates realistic but random data.
	 */
	seed?: number;
	/**
	 * Generic density parameter (0-1).
	 * For orders: probability that a day will have orders
	 * Default: 0.9 (90% of days have orders)
	 */
	density?: number;
	/**
	 * Generic volume parameter.
	 * For orders: average orders per active day
	 * Default: 7
	 */
	volume?: number;
}

/**
 * Simple seeded random number generator
 *
 * Exported for reuse in other mock data generators to ensure
 * consistent randomness across all endpoints when using the same seed.
 *
 * @param seed - Seed value for reproducible randomness
 * @return Function that generates random numbers (0-1)
 */
export function seededRandom( seed: number ): () => number {
	let state = seed;
	return () => {
		state = ( state * 9301 + 49297 ) % 233280;
		return state / 233280;
	};
}

/**
 * Generate date intervals
 * @param from     - Start date
 * @param to       - End date
 * @param interval - Interval type
 * @return Array of date intervals
 */
function generateDateIntervals(
	from: string,
	to: string,
	interval: 'day' | 'week' | 'month' = 'day'
): Array< { start: Date; end: Date } > {
	const startDate = new Date( from );
	const endDate = new Date( to );
	const intervals: Array< { start: Date; end: Date } > = [];

	const current = new Date( startDate );

	while ( current <= endDate ) {
		const intervalStart = new Date( current );
		let intervalEnd: Date;

		switch ( interval ) {
			case 'day':
				intervalEnd = new Date( current );
				intervalEnd.setHours( 23, 59, 59, 999 );
				current.setDate( current.getDate() + 1 );
				break;
			case 'week':
				intervalEnd = new Date( current );
				intervalEnd.setDate( intervalEnd.getDate() + 6 );
				intervalEnd.setHours( 23, 59, 59, 999 );
				current.setDate( current.getDate() + 7 );
				break;
			case 'month':
				intervalEnd = new Date( current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999 );
				current.setMonth( current.getMonth() + 1 );
				break;
		}

		// Adjust the last interval to not exceed endDate
		if ( intervalEnd > endDate ) {
			intervalEnd = new Date( endDate );
		}

		intervals.push( {
			start: intervalStart,
			end: intervalEnd,
		} );

		if ( intervalEnd >= endDate ) {
			break;
		}
	}

	return intervals;
}

/**
 * Format a date in ISO format compatible with the API
 */
function formatISODate( date: Date ): string {
	return date.toISOString().replace( /\.\d{3}Z$/, '+00:00' );
}

/**
 * Format a date in YYYY-MM-DD format for time_interval
 */
function formatDateOnly( date: Date ): string {
	return date.toISOString().split( 'T' )[ 0 ];
}

/**
 * Generate mock order data for a specific interval
 */
function generateIntervalData(
	start: Date,
	end: Date,
	random: () => number,
	sparsity: number,
	avgOrders: number
): OrdersReportResponse[ 'data' ][ 0 ] {
	// Determine if this interval has orders
	const hasOrders = random() < sparsity;

	if ( ! hasOrders ) {
		return {
			time_interval: formatDateOnly( start ),
			date_start: formatISODate( start ),
			date_end: formatISODate( end ),
			orders_no: '0',
			orders_value_net: '0.0',
			orders_value_gross: '0.0',
			total_sales: '0.0',
			avg_items: '0.0',
			average_order_value: '0.0',
			coupons: '0.0',
			refunds: '0.0',
			product_net_revenue: '0.0',
			cogs_amount: '0.0',
			profit_margin: '0.0',
			paid_orders_count: '0',
			paid_net_sales: '0.0',
			unpaid_orders_count: '0',
			unpaid_net_sales: '0.0',
		};
	}

	// Generate number of orders (variation around the average)
	const ordersNo = Math.max( 1, Math.floor( avgOrders + ( random() - 0.5 ) * avgOrders ) );

	// Generate realistic values
	const avgOrderValue = 50 + random() * 150; // Between $50 and $200
	const totalSales = ordersNo * avgOrderValue;
	const avgItems = 1.5 + random() * 1.5; // Between 1.5 and 3 items per order

	// Calculate other values based on realistic relationships
	const coupons = totalSales * ( 0.1 + random() * 0.3 ); // 10-40% in coupons
	const ordersValueGross = totalSales * ( 1.1 + random() * 0.3 ); // +10-40%
	const ordersValueNet = totalSales - coupons * 0.5; // Partial discount
	const refunds = totalSales * ( random() * 0.05 ); // 0-5% in refunds
	const cogsAmount = totalSales * ( 0.4 + random() * 0.2 ); // 40-60% in cost
	const productNetRevenue = totalSales - refunds;
	const profitMargin = productNetRevenue - cogsAmount;

	// Split orders into paid / unpaid buckets (most orders are paid).
	const paidOrdersCount = Math.max( 0, Math.round( ordersNo * 0.85 ) );
	const unpaidOrdersCount = ordersNo - paidOrdersCount;
	const paidNetSales = ordersValueNet * 0.85;
	const unpaidNetSales = ordersValueNet - paidNetSales;

	return {
		time_interval: formatDateOnly( start ),
		date_start: formatISODate( start ),
		date_end: formatISODate( end ),
		orders_no: ordersNo.toString(),
		orders_value_net: ordersValueNet.toFixed( 2 ),
		orders_value_gross: ordersValueGross.toFixed( 2 ),
		total_sales: totalSales.toFixed( 2 ),
		avg_items: avgItems.toFixed( 4 ),
		average_order_value: avgOrderValue.toFixed( 12 ),
		coupons: coupons.toFixed( 2 ),
		refunds: refunds.toFixed( 2 ),
		product_net_revenue: productNetRevenue.toFixed( 2 ),
		cogs_amount: cogsAmount.toFixed( 2 ),
		profit_margin: profitMargin.toFixed( 2 ),
		paid_orders_count: paidOrdersCount.toString(),
		paid_net_sales: paidNetSales.toFixed( 2 ),
		unpaid_orders_count: unpaidOrdersCount.toString(),
		unpaid_net_sales: unpaidNetSales.toFixed( 2 ),
	};
}

/**
 * Calculate the summary from the array of data
 */
function calculateSummary(
	data: OrdersReportResponse[ 'data' ],
	from: string,
	to: string
): OrdersReportResponse[ 'summary' ] {
	const totals = data.reduce(
		( acc, item ) => ( {
			orders_no: acc.orders_no + parseFloat( item.orders_no || '0' ),
			orders_value_net: acc.orders_value_net + parseFloat( item.orders_value_net || '0' ),
			orders_value_gross: acc.orders_value_gross + parseFloat( item.orders_value_gross || '0' ),
			total_sales: acc.total_sales + parseFloat( item.total_sales || '0' ),
			avg_items_sum:
				acc.avg_items_sum +
				parseFloat( item.avg_items || '0' ) * parseFloat( item.orders_no || '0' ),
			coupons: acc.coupons + parseFloat( item.coupons || '0' ),
			refunds: acc.refunds + parseFloat( item.refunds || '0' ),
			product_net_revenue: acc.product_net_revenue + parseFloat( item.product_net_revenue || '0' ),
			cogs_amount: acc.cogs_amount + parseFloat( item.cogs_amount || '0' ),
			profit_margin: acc.profit_margin + parseFloat( item.profit_margin || '0' ),
			paid_orders_count: acc.paid_orders_count + parseFloat( item.paid_orders_count || '0' ),
			paid_net_sales: acc.paid_net_sales + parseFloat( item.paid_net_sales || '0' ),
			unpaid_orders_count: acc.unpaid_orders_count + parseFloat( item.unpaid_orders_count || '0' ),
			unpaid_net_sales: acc.unpaid_net_sales + parseFloat( item.unpaid_net_sales || '0' ),
		} ),
		{
			orders_no: 0,
			orders_value_net: 0,
			orders_value_gross: 0,
			total_sales: 0,
			avg_items_sum: 0,
			coupons: 0,
			refunds: 0,
			product_net_revenue: 0,
			cogs_amount: 0,
			profit_margin: 0,
			paid_orders_count: 0,
			paid_net_sales: 0,
			unpaid_orders_count: 0,
			unpaid_net_sales: 0,
		}
	);

	const avgItems = totals.orders_no > 0 ? totals.avg_items_sum / totals.orders_no : 0;
	const averageOrderValue = totals.orders_no > 0 ? totals.total_sales / totals.orders_no : 0;

	return {
		orders_no: totals.orders_no.toString(),
		orders_value_net: totals.orders_value_net.toFixed( 2 ),
		orders_value_gross: totals.orders_value_gross.toFixed( 2 ),
		total_sales: totals.total_sales.toFixed( 2 ),
		avg_items: avgItems.toFixed( 4 ),
		average_order_value: averageOrderValue.toFixed( 12 ),
		coupons: totals.coupons.toFixed( 2 ),
		refunds: totals.refunds.toFixed( 2 ),
		product_net_revenue: totals.product_net_revenue.toFixed( 2 ),
		cogs_amount: totals.cogs_amount.toFixed( 2 ),
		profit_margin: totals.profit_margin.toFixed( 2 ),
		paid_orders_count: totals.paid_orders_count.toString(),
		paid_net_sales: totals.paid_net_sales.toFixed( 2 ),
		unpaid_orders_count: totals.unpaid_orders_count.toString(),
		unpaid_net_sales: totals.unpaid_net_sales.toFixed( 2 ),
		date_start: formatISODate( new Date( from ) ),
		date_end: formatISODate( new Date( to ) ),
	};
}

/**
 * Generate mock dynamic data for the orders-by-product-type endpoint
 *
 * @param params - Generation parameters based on the request
 * @return Mock data that matches the API format
 *
 * @example
 * ```ts
 * const mockData = generateOrdersByProductType({
 *   from: '2025-11-15T00:00:00.000+00:00',
 *   to: '2025-12-14T23:59:59.999+00:00',
 *   interval: 'day',
 *   seed: 12345,   // For reproducible data
 *   density: 0.3,  // 30% of days with orders
 *   volume: 3,     // 3 orders per active day
 * });
 * ```
 */
export function generateOrdersByProductType( params: GenerateOrdersParams ): OrdersReportResponse {
	const { from, to, interval = 'day', seed = Date.now(), density = 0.9, volume = 7 } = params;

	const random = seededRandom( seed );
	const intervals = generateDateIntervals( from, to, interval );

	const data = intervals.map( ( { start, end } ) =>
		generateIntervalData( start, end, random, density, volume )
	);

	const summary = calculateSummary( data, from, to );

	return {
		summary,
		data,
	};
}

/**
 * Filters a full spectrum of data to a specific date range
 *
 * @param fullData    - Complete dataset (the "spectrum")
 * @param requestFrom - Start date of the request
 * @param requestTo   - End date of the request
 * @return Filtered data array
 */
export function filterDataByDateRange(
	fullData: OrdersReportResponse[ 'data' ],
	requestFrom: string,
	requestTo: string
): OrdersReportResponse[ 'data' ] {
	const fromDate = new Date( requestFrom );
	const toDate = new Date( requestTo );

	return fullData.filter( item => {
		const itemDate = new Date( item.date_start );
		return itemDate >= fromDate && itemDate <= toDate;
	} );
}

/**
 * Recalculates summary based on filtered data
 *
 * @param filteredData - Array of filtered data items
 * @param from         - Request start date
 * @param to           - Request end date
 * @return Summary object
 */
export function recalculateSummary(
	filteredData: OrdersReportResponse[ 'data' ],
	from: string,
	to: string
): OrdersReportResponse[ 'summary' ] {
	// If no data, return zeros
	if ( filteredData.length === 0 ) {
		return {
			orders_no: '0',
			orders_value_net: '0.0',
			orders_value_gross: '0.0',
			total_sales: '0.0',
			avg_items: '0.0',
			average_order_value: '0.0',
			coupons: '0.0',
			refunds: '0.0',
			product_net_revenue: '0.0',
			cogs_amount: '0.0',
			profit_margin: '0.0',
			paid_orders_count: '0',
			paid_net_sales: '0.0',
			unpaid_orders_count: '0',
			unpaid_net_sales: '0.0',
			date_start: formatISODate( new Date( from ) ),
			date_end: formatISODate( new Date( to ) ),
		};
	}

	// Calculate from filtered data
	return calculateSummary( filteredData, from, to );
}

/**
 * Mock data static - Primary Period (for compatibility)
 *
 * Uses the generator with default values
 */
export const mockOrdersByProductTypeData: OrdersReportResponse = generateOrdersByProductType( {
	from: '2024-01-01T00:00:00.000+00:00',
	to: '2024-01-07T23:59:59.999+00:00',
	interval: 'day',
	seed: 12345,
	density: 0.9, // 90% of days have orders
	volume: 7, // 7 orders per active day
} );

/**
 * Mock data static - Comparison Period (for compatibility)
 *
 * Slightly lower values to show positive growth
 */
export const mockOrdersByProductTypeComparisonData: OrdersReportResponse =
	generateOrdersByProductType( {
		from: '2023-12-25T00:00:00.000+00:00',
		to: '2023-12-31T23:59:59.999+00:00',
		interval: 'day',
		seed: 54321,
		density: 0.85, // Slightly less dense
		volume: 6, // Slightly lower volume
	} );
