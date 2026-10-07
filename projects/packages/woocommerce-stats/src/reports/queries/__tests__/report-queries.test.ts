/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { reportOrderAttributionSummaryQuery } from '../report-order-attribution-summary-query';
import { reportVisitorsQuery } from '../report-visitors-query';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '@automattic/jetpack-premium-analytics-sdk', () => ( {
	toBucketStamp: ( raw: string, zone: string ) => `${ raw } in ${ zone }`,
} ) );
jest.mock( '../../utils/report-timezone', () => ( {
	resolveReportTimeZone: () => 'Asia/Taipei',
} ) );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

const PERIOD = { from: '2026-06-01', to: '2026-06-07', interval: 'day' };

afterEach( () => {
	jest.resetAllMocks();
} );

describe( 'reportVisitorsQuery', () => {
	// A report is normalized under a zone, so the same zone has to key its cache entry.
	it( 'keys the query by the site zone and normalizes the response under it', async () => {
		mockApiFetch.mockResolvedValue( {
			data: [
				{
					time_interval: '2026-06-15',
					date_start: '2026-06-15T00:00:00+08:00',
					date_end: '2026-06-15T23:59:59+08:00',
					active_sessions: '3',
					visitors: '2',
				},
			],
			summary: { date_start: '', date_end: '', active_sessions: '3', visitors: '2' },
		} );

		const query = reportVisitorsQuery( PERIOD );
		const queryFn = query.queryFn as () => Promise< unknown >;

		expect( query.queryKey ).toContain( 'Asia/Taipei' );
		await expect( queryFn() ).resolves.toMatchObject( {
			data: [ { date_start: '2026-06-15T00:00:00+08:00 in Asia/Taipei' } ],
		} );
	} );
} );

describe( 'reportOrderAttributionSummaryQuery', () => {
	it( 'reads both periods from the by-product endpoint when product filters are present', async () => {
		mockApiFetch.mockResolvedValue( { view: 'device', order_by: 'net_sales', data: [] } );

		const query = reportOrderAttributionSummaryQuery( {
			...PERIOD,
			compare_from: '2026-05-25',
			compare_to: '2026-05-31',
			view: 'device',
			filters: [ { key: 'product_type', value: [ 'booking' ], compare: 'IN' } ],
		} );
		const queryFn = query.queryFn as () => Promise< unknown >;

		await queryFn();

		const paths = mockApiFetch.mock.calls.map(
			( [ options ] ) => ( options as { path: string } ).path
		);

		expect( paths ).toHaveLength( 2 );
		expect( paths[ 0 ] ).toContain( '/order-attribution-by-product/device/summary' );
		expect( paths[ 1 ] ).toContain( '/order-attribution-by-product/device/summary' );
	} );
} );
