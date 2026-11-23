/**
 * Internal dependencies
 */
import { deviceNetSales, windowOf } from './device-net-sales';

const NET_SALES_TREND = { base: 1400, growth: 10, amplitude: 150 };

const DEVICES = [
	{ item: 'Mobile', share: 0.52 },
	{ item: 'Desktop', share: 0.33 },
	{ item: 'Tablet', share: 0.1 },
	// The live report sends an empty item for orders with no recorded device.
	{ item: '', share: 0.05 },
];

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
			current_period: deviceNetSales( primary, NET_SALES_TREND, share ),
			previous_period: deviceNetSales( comparison, NET_SALES_TREND, share ),
		} ) ),
	};
}
