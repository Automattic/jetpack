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
	{ item: 'Mobile', share: 0.58 },
	{ item: 'Desktop', share: 0.27 },
	{ item: 'Tablet', share: 0.1 },
	// The live report sends an empty item for orders with no recorded device.
	{ item: '', share: 0.05 },
];

/** Bookings are a fraction of the store's net sales, so this widget reads smaller than Sales by device. */
const BOOKINGS_NET_SALES_PER_DAY = 400;

const netSalesPerDay = ( dayIndex: number ) =>
	Math.max(
		1,
		BOOKINGS_NET_SALES_PER_DAY + 3 * ( dayIndex - ANCHOR_DAY ) + 45 * Math.sin( dayIndex / 8 )
	);

const netSalesOf = ( bucket: ReportBucket ) =>
	netSalesPerDay( bucket.dayIndex ) * ( dayIndexOf( bucket.date_end ) - bucket.dayIndex + 1 );

/**
 * The order-attribution-by-product report, flat and for one window: unlike the regular endpoint it
 * takes no comparison window, so the widget asks for the comparison period in a second request.
 * Four rows stay under the normalizer's item limit, so a device missing from a window reads as
 * zero rather than cut.
 *
 * @param {URLSearchParams} query - The request's query params.
 * @return {unknown} The raw report response.
 */
export function buildOrderAttributionByProductDeviceResponse( query: URLSearchParams ): unknown {
	const windowQuery = new URLSearchParams( {
		from: query.get( 'from' ) ?? '',
		to: query.get( 'to' ) ?? '',
		interval: query.get( 'interval' ) ?? 'day',
	} );
	const buckets = bucketsForWindow( windowQuery );

	return {
		view: 'device',
		order_by: 'net_sales',
		data: DEVICES.map( ( { item, share } ) => {
			const intervals = buckets.map( bucket => ( {
				time_interval: bucket.time_interval,
				date_start: bucket.date_start,
				date_end: bucket.date_end,
				net_sales: money( netSalesOf( bucket ) * share ),
			} ) );

			return {
				item,
				value: money(
					intervals.reduce( ( total, interval ) => total + Number( interval.net_sales ), 0 )
				),
				intervals,
			};
		} ),
	};
}
