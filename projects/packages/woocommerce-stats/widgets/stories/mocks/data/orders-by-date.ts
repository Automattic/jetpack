/**
 * Internal dependencies
 */
import {
	ANCHOR_DAY,
	bucketsForWindow,
	count,
	dayIndexOf,
	money,
	type ReportBucket,
} from './interval-buckets';

/** Which bucket of a window has no orders, as a share of its length. */
const EMPTY_BUCKET_SHARE = 1 / 3;

/** The shortest window with room for a zero-order bucket beside buckets that have orders. */
const MIN_BUCKETS_WITH_EMPTY = 3;

type OrderTotals = {
	orders: number;
	items: number;
	gross: number;
	refunds: number;
	coupons: number;
	net: number;
	cogs: number;
	paidOrders: number;
	paidNet: number;
};

const NO_ORDERS: OrderTotals = {
	orders: 0,
	items: 0,
	gross: 0,
	refunds: 0,
	coupons: 0,
	net: 0,
	cogs: 0,
	paidOrders: 0,
	paidNet: 0,
};

const ordersPerDay = ( dayIndex: number ) =>
	Math.max(
		1,
		18 +
			0.2 * ( dayIndex - ANCHOR_DAY ) +
			6 * Math.sin( dayIndex / 7 ) +
			3 * Math.cos( dayIndex / 11 )
	);

const averageOrderValue = ( dayIndex: number ) => 42 + 8 * Math.sin( dayIndex / 9 );

const cogsShare = ( dayIndex: number ) => 0.55 + 0.06 * Math.sin( dayIndex / 17 );

/**
 * A bucket's order totals, on a trend anchored to its own days rather than to its position in the
 * window, so the same calendar day reads the same in every window that covers it.
 *
 * @param {ReportBucket} bucket - The bucket to total.
 * @return {OrderTotals} The bucket's totals.
 */
function totalsFor( bucket: ReportBucket ): OrderTotals {
	const spanDays = dayIndexOf( bucket.date_end ) - bucket.dayIndex + 1;
	const orders = Math.round( ordersPerDay( bucket.dayIndex ) * spanDays );
	const gross = orders * averageOrderValue( bucket.dayIndex );
	const refunds = gross * 0.03;
	const coupons = gross * 0.04;
	const net = gross - refunds - coupons;

	return {
		orders,
		items: Math.round( orders * 2.3 ),
		gross,
		refunds,
		coupons,
		net,
		cogs: net * cogsShare( bucket.dayIndex ),
		paidOrders: Math.round( orders * 0.86 ),
		paidNet: net * 0.86,
	};
}

const addTotals = ( left: OrderTotals, right: OrderTotals ): OrderTotals => ( {
	orders: left.orders + right.orders,
	items: left.items + right.items,
	gross: left.gross + right.gross,
	refunds: left.refunds + right.refunds,
	coupons: left.coupons + right.coupons,
	net: left.net + right.net,
	cogs: left.cogs + right.cogs,
	paidOrders: left.paidOrders + right.paidOrders,
	paidNet: left.paidNet + right.paidNet,
} );

/**
 * One row of the orders report, in the string-valued shape the live endpoint sends.
 *
 * @param {OrderTotals}            totals - The period's totals.
 * @param {Record<string, string>} bounds - The period's bounds and, for a data row, its label.
 * @return {object} The raw row.
 */
function toRawRow( totals: OrderTotals, bounds: Record< string, string > ) {
	const { orders, items, gross, refunds, coupons, net, cogs, paidOrders, paidNet } = totals;

	return {
		...bounds,
		// Null, not a zero average, for a period with no orders, so the null case stays covered.
		average_order_value: orders ? money( net / orders ) : null,
		avg_items: orders ? ( items / orders ).toFixed( 2 ) : null,
		cogs_amount: money( cogs ),
		coupons: money( coupons ),
		orders_no: count( orders ),
		orders_value_gross: money( gross ),
		orders_value_net: money( net ),
		paid_orders_count: count( paidOrders ),
		paid_net_sales: money( paidNet ),
		product_net_revenue: money( net ),
		profit_margin: net ? ( ( ( net - cogs ) / net ) * 100 ).toFixed( 2 ) : '0.00',
		refunds: money( refunds ),
		total_items: count( items ),
		// Gross sales less refunds, so it reads above the net figures, which drop coupons too.
		total_sales: money( gross - refunds ),
		unpaid_orders_count: count( orders - paidOrders ),
		unpaid_net_sales: money( net - paidNet ),
	};
}

/**
 * The orders-by-date report of a window: one row per interval bucket, every figure a deterministic
 * function of the window, plus one bucket with no orders once the window is long enough to hold
 * one. The shipped story windows are chosen so the comparison period reads lower, which the
 * seasonal terms do not give for an arbitrary pair of windows.
 *
 * @param {URLSearchParams} query - The request's query params (`from`, `to`, `interval`).
 * @return {unknown} The raw report response.
 */
export function buildOrdersByDateResponse( query: URLSearchParams ): unknown {
	const buckets = bucketsForWindow( query );
	const hasEmptyBucket = buckets.length >= MIN_BUCKETS_WITH_EMPTY;
	const emptyBucket = Math.floor( buckets.length * EMPTY_BUCKET_SHARE );
	const totals = buckets.map( ( bucket, index ) =>
		hasEmptyBucket && index === emptyBucket ? NO_ORDERS : totalsFor( bucket )
	);

	return {
		data: buckets.map( ( bucket, index ) =>
			toRawRow( totals[ index ], {
				date_start: bucket.date_start,
				date_end: bucket.date_end,
				time_interval: bucket.time_interval,
			} )
		),
		summary: toRawRow( totals.reduce( addTotals, NO_ORDERS ), {
			date_start: buckets[ 0 ]?.date_start ?? '',
			date_end: buckets[ buckets.length - 1 ]?.date_end ?? '',
		} ),
	};
}
