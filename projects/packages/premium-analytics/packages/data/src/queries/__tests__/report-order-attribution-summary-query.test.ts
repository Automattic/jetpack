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

beforeEach( () => {
	mockApiFetch.mockResolvedValue( {
		view: 'device',
		order_by: 'net_sales',
		data: [],
	} );
} );

afterEach( () => {
	jest.clearAllMocks();
} );

describe( 'reportOrderAttributionSummaryQuery', () => {
	it( 'uses the by-product endpoint when product filters are present', async () => {
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

		expect( mockApiFetch ).toHaveBeenCalledTimes( 2 );
		expect( mockApiFetch ).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining( {
				path: expect.stringContaining( '/order-attribution-by-product/device/summary' ),
			} )
		);
		expect( mockApiFetch ).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining( {
				path: expect.stringContaining( '/order-attribution-by-product/device/summary' ),
			} )
		);
	} );
} );
