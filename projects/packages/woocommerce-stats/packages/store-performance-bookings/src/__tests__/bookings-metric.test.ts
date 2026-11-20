/**
 * External dependencies
 */
import { useReport } from '@automattic/jetpack-premium-analytics-sdk';
import apiFetch from '@wordpress/api-fetch';
import { removeFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import { getStorePerformanceMetrics } from '../../../../widgets/store-performance/metrics';
import {
	bookingsMetric,
	registerBookingsMetric,
	STORE_PERFORMANCE_METRICS_FILTER,
	type StorePerformanceMetric,
} from '../bookings-metric';
import { bookingsReportQuery } from '../use-bookings-report';

jest.mock( '@automattic/jetpack-premium-analytics-sdk', () => ( {
	useReport: jest.fn(),
	toBucketStamp: ( raw: string ) => `stamp:${ raw }`,
} ) );
jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock( '@wordpress/date', () => ( {
	getSettings: () => ( { timezone: { string: 'Europe/Madrid', offset: 1 } } ),
} ) );

const mockUseReport = useReport as jest.Mock;
const mockApiFetch = apiFetch as unknown as jest.Mock;
const PERIOD = { from: '2026-06-01', to: '2026-06-07', interval: 'day' };

const ids = ( metrics: StorePerformanceMetric[] ) => metrics.map( item => item.id );

afterEach( () => {
	jest.clearAllMocks();
	removeFilter(
		STORE_PERFORMANCE_METRICS_FILTER,
		'jetpack-woocommerce-stats/store-performance-bookings'
	);
} );

describe( 'registerBookingsMetric', () => {
	it( 'offers Bookings to Store performance after Orders', () => {
		registerBookingsMetric();

		expect( ids( getStorePerformanceMetrics() ) ).toEqual( [
			'net-sales',
			'orders',
			'bookings',
			'visitors',
			'conversion-rate',
			'customers',
		] );
	} );
} );

describe( 'bookingsMetric', () => {
	it( 'runs the bookings report under the dashboard params', () => {
		bookingsMetric().useReport( PERIOD );

		expect( mockUseReport ).toHaveBeenCalledWith( bookingsReportQuery, PERIOD, expect.anything() );
	} );
} );

describe( 'bookingsReportQuery', () => {
	it( 'asks the proxy for the orders of the booking products, in the site zone', async () => {
		mockApiFetch.mockResolvedValue( {
			summary: {
				date_start: '2026-06-01 00:00:00',
				date_end: '2026-06-07 23:59:59',
				orders_no: '7',
			},
			data: [
				{ date_start: '2026-06-01 00:00:00', date_end: '2026-06-01 23:59:59', orders_no: 'n/a' },
			],
		} );
		const query = bookingsReportQuery( PERIOD );

		expect( query.queryKey ).toEqual( [
			'store-performance-bookings',
			'2026-06-01',
			'2026-06-07',
			'day',
			undefined,
			'Europe/Madrid',
		] );
		expect( query.enabled ).toBe( true );
		expect( bookingsReportQuery( { ...PERIOD, from: '' } ).enabled ).toBe( false );

		const report = await query.queryFn?.();
		const path = mockApiFetch.mock.calls[ 0 ][ 0 ].path;
		expect( path ).toContain(
			'/woocommerce-stats/proxy/v2/analytics/reports/orders-by-product-type/by-date?'
		);
		expect( decodeURIComponent( path ) ).toContain( 'filters[0][key]=product_type' );
		expect( decodeURIComponent( path ) ).toContain( 'filters[0][value][0]=booking' );
		expect( report ).toEqual( {
			summary: {
				date_start: 'stamp:2026-06-01 00:00:00',
				date_end: 'stamp:2026-06-07 23:59:59',
				orders_no: 7,
			},
			data: [
				{
					date_start: 'stamp:2026-06-01 00:00:00',
					date_end: 'stamp:2026-06-01 23:59:59',
					orders_no: 0,
				},
			],
		} );
	} );
} );

describe( 'bookingsReportQuery fetch', () => {
	// A fetch `Response`, as far as the report reads one.
	const response = ( status: number, json: () => Promise< unknown > ) => ( { status, json } );
	const fetchReport = () => bookingsReportQuery( PERIOD ).queryFn?.();

	it( 'asks apiFetch for the raw response', async () => {
		mockApiFetch.mockResolvedValue( { summary: {}, data: [] } );

		await fetchReport();

		expect( mockApiFetch.mock.calls[ 0 ][ 0 ].parse ).toBe( false );
	} );

	it.each( [
		[
			'an error WordPress.com passed through',
			response( 403, async () => ( { error: 'unauthorized', message: 'No access.' } ) ),
			{ error: 'unauthorized', message: 'No access.', status: 403 },
		],
		[
			'an error whose body is not JSON',
			response( 502, async () => {
				throw new SyntaxError( 'Unexpected token <' );
			} ),
			{ code: 'invalid_json', status: 502 },
		],
	] )( 'keeps the status of %s', async ( _case, rejected, thrown ) => {
		mockApiFetch.mockRejectedValue( rejected );

		await expect( fetchReport() ).rejects.toMatchObject( thrown );
	} );

	it( 'lets apiFetch refresh a stale nonce and replay the request', async () => {
		mockApiFetch
			.mockRejectedValueOnce(
				response( 403, async () => ( { code: 'rest_cookie_invalid_nonce', message: 'Expired.' } ) )
			)
			.mockResolvedValueOnce( { summary: {}, data: [] } );

		await expect( fetchReport() ).resolves.toEqual( { summary: expect.anything(), data: [] } );
		expect( mockApiFetch.mock.calls[ 1 ][ 0 ] ).not.toHaveProperty( 'parse' );
	} );

	it( 'rethrows an error that carries no response', async () => {
		const offline = new TypeError( 'Failed to fetch' );
		mockApiFetch.mockRejectedValue( offline );

		await expect( fetchReport() ).rejects.toBe( offline );
	} );
} );
