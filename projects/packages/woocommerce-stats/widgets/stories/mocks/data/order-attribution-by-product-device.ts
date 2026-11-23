/**
 * Internal dependencies
 */
import { deviceNetSales, windowOf } from './device-net-sales';

const DEVICES = [
	{ item: 'Mobile', share: 0.58 },
	{ item: 'Desktop', share: 0.27 },
	{ item: 'Tablet', share: 0.1 },
	{ item: '', share: 0.05 },
];

/** Bookings are a fraction of the store's net sales, so this widget reads smaller than Sales by device. */
const BOOKINGS_NET_SALES_TREND = { base: 400, growth: 3, amplitude: 45 };

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
	const windowQuery = windowOf( query, 'from', 'to' );

	return {
		view: 'device',
		order_by: 'net_sales',
		data: DEVICES.map( ( { item, share } ) => ( {
			item,
			...deviceNetSales( windowQuery, BOOKINGS_NET_SALES_TREND, share ),
		} ) ),
	};
}
