/**
 * Internal dependencies
 */
import {
	ANCHOR_DAY,
	bucketsForWindow,
	dayIndexOf,
	money,
	type ReportBucket,
} from './interval-buckets';

const DEVICES = [
	{ item: 'Mobile', share: 0.52 },
	{ item: 'Desktop', share: 0.33 },
	{ item: 'Tablet', share: 0.1 },
	// The live report sends an empty item for orders with no recorded device.
	{ item: '', share: 0.05 },
];

const netSalesPerDay = ( dayIndex: number ) =>
	Math.max( 1, 1400 + 10 * ( dayIndex - ANCHOR_DAY ) + 150 * Math.sin( dayIndex / 8 ) );

const netSalesOf = ( bucket: ReportBucket ) =>
	netSalesPerDay( bucket.dayIndex ) * ( dayIndexOf( bucket.date_end ) - bucket.dayIndex + 1 );

/**
 * One device's figures for a window: its share of each bucket's net sales, and their sum.
 *
 * @param {URLSearchParams} windowQuery - The window's `from`, `to` and `interval`.
 * @param {number}          share       - The device's share of the store's net sales.
 * @return {object} The period's value and intervals, as the live endpoint sends them.
 */
function periodFor( windowQuery: URLSearchParams, share: number ) {
	const intervals = bucketsForWindow( windowQuery ).map( bucket => ( {
		time_interval: bucket.time_interval,
		date_start: bucket.date_start,
		date_end: bucket.date_end,
		net_sales: money( netSalesOf( bucket ) * share ),
	} ) );

	return {
		value: money(
			intervals.reduce( ( total, interval ) => total + Number( interval.net_sales ), 0 )
		),
		intervals,
	};
}

const windowOf = ( query: URLSearchParams, fromKey: string, toKey: string ) =>
	new URLSearchParams( {
		from: query.get( fromKey ) ?? '',
		to: query.get( toKey ) ?? '',
		interval: query.get( 'interval' ) ?? 'day',
	} );

/**
 * The order-attribution-by-device report. The endpoint answers both periods in one response, so
 * each is computed from its own window: `from`/`to` and `compare_from`/`compare_to`.
 *
 * @param {URLSearchParams} query - The request's query params.
 * @return {unknown} The raw report response.
 */
export function buildOrderAttributionDeviceResponse( query: URLSearchParams ): unknown {
	const primary = windowOf( query, 'from', 'to' );
	const comparison = windowOf( query, 'compare_from', 'compare_to' );

	return {
		view: 'device',
		order_by: 'net_sales',
		data: DEVICES.map( ( { item, share } ) => ( {
			item,
			current_period: periodFor( primary, share ),
			previous_period: periodFor( comparison, share ),
		} ) ),
	};
}
