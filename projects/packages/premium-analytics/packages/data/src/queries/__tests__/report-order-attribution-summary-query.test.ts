/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { reportOrderAttributionSummaryQuery } from '../report-order-attribution-summary-query';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

describe( 'reportOrderAttributionSummaryQuery', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( {
			view: 'device',
			order_by: 'net_sales',
			data: [],
		} );
	} );

	it( 'requests each period from the by-product endpoint when product filters are present', async () => {
		const query = reportOrderAttributionSummaryQuery( {
			from: '2026-06-01',
			to: '2026-06-07',
			compare_from: '2026-05-25',
			compare_to: '2026-05-31',
			interval: 'day',
			view: 'device',
			filters: [
				{
					key: 'product_type',
					value: [ 'booking', 'bookable-event', 'bookable-service' ],
					compare: 'IN',
				},
			],
		} );

		const queryFn = query.queryFn as () => Promise< unknown >;
		await queryFn();

		const requests = mockApiFetch.mock.calls.map( ( [ options ] ) => {
			const [ path, search ] = String( options.path ).split( '?' );
			const args = new URLSearchParams( search );
			return [ path, args.get( 'from' ), args.get( 'to' ) ];
		} );
		const byProductPath = expect.stringContaining( '/order-attribution-by-product/device/summary' );
		expect( requests ).toEqual( [
			[ byProductPath, '2026-06-01', '2026-06-07' ],
			[ byProductPath, '2026-05-25', '2026-05-31' ],
		] );
	} );
} );
