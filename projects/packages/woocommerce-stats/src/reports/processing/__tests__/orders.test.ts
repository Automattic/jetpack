/**
 * Internal dependencies
 */
import { sanitizeReportOrdersResponse } from '../orders';

jest.mock( '@automattic/jetpack-premium-analytics-sdk', () => ( {
	toBucketStamp: ( raw: string ) => raw,
} ) );

const row = ( orders_no: string | null, average: string | null ) =>
	( {
		date_start: '2026-09-17T00:00:00+00:00',
		date_end: '2026-09-17T23:59:59+00:00',
		orders_no,
		average_order_value: average,
		avg_items: average,
	} ) as never;

describe( 'sanitizeReportOrdersResponse', () => {
	it.each( [
		[ 'reads 0 for a period with no orders', '0', '0', null ],
		[ 'reads null for a period with no orders', '0', null, null ],
		[ 'has a null order count', null, '0', null ],
		[ 'has orders', '2', '270.5', 270.5 ],
	] )( 'averages a summary and a bucket whose API %s', ( _, ordersNo, average, expected ) => {
		const { summary, data } = sanitizeReportOrdersResponse(
			{ summary: row( ordersNo, average ), data: [ row( ordersNo, average ) ] },
			'UTC'
		);

		expect(
			[ summary, data[ 0 ] ].flatMap( item => [ item.average_order_value, item.avg_items ] )
		).toEqual( [ expected, expected, expected, expected ] );
	} );
} );
