/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { fetchReport } from '../fetch-report';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

// A fetch `Response`, as far as the client reads one.
const response = ( status: number, json: () => Promise< unknown > ) => ( { status, json } );

afterEach( () => {
	jest.resetAllMocks();
} );

describe( 'fetchReport', () => {
	it( 'requests the report through the package proxy, without its empty params', async () => {
		mockApiFetch.mockResolvedValue( response( 200, async () => ( { data: [] } ) ) );

		await fetchReport( '/orders/by-date', {
			from: '2026-06-01',
			to: null,
			date_type: undefined,
			filters: [ { key: 'product_type', value: [ 'booking' ], compare: 'IN' } ],
		} );

		const { path, parse } = mockApiFetch.mock.calls[ 0 ][ 0 ] as { path: string; parse: boolean };
		const [ route, query ] = decodeURIComponent( path ).split( '?' );

		expect( route ).toBe(
			'/jetpack/v4/woocommerce-stats/proxy/v2/analytics/reports/orders/by-date'
		);
		expect( query ).toBe(
			'from=2026-06-01&filters[0][key]=product_type&filters[0][value][0]=booking&filters[0][compare]=IN'
		);
		expect( parse ).toBe( false );
	} );

	it( 'parses a successful response', async () => {
		mockApiFetch.mockResolvedValue( response( 200, async () => ( { orders: 42 } ) ) );

		await expect( fetchReport( 'orders/by-date' ) ).resolves.toEqual( { orders: 42 } );
	} );

	it( 'returns the data a middleware already parsed', async () => {
		mockApiFetch.mockResolvedValue( { orders: 42 } );

		await expect( fetchReport( 'orders/by-date' ) ).resolves.toEqual( { orders: 42 } );
	} );

	it( 'keeps the status of an error WordPress.com passed through', async () => {
		mockApiFetch.mockRejectedValue(
			response( 400, async () => ( { error: 'invalid_interval', message: 'Bad interval.' } ) )
		);

		await expect( fetchReport( 'orders/by-date' ) ).rejects.toEqual( {
			error: 'invalid_interval',
			message: 'Bad interval.',
			status: 400,
		} );
	} );

	it( 'keeps the status of an error whose body is not JSON', async () => {
		mockApiFetch.mockRejectedValue(
			response( 502, async () => {
				throw new SyntaxError( 'Unexpected token <' );
			} )
		);

		await expect( fetchReport( 'orders/by-date' ) ).rejects.toMatchObject( {
			code: 'invalid_json',
			status: 502,
		} );
	} );

	it( 'lets apiFetch refresh a stale nonce and replay the request', async () => {
		mockApiFetch
			.mockRejectedValueOnce(
				response( 403, async () => ( { code: 'rest_cookie_invalid_nonce', message: 'Expired.' } ) )
			)
			.mockResolvedValueOnce( { orders: 42 } );

		await expect( fetchReport( 'orders/by-date' ) ).resolves.toEqual( { orders: 42 } );
		expect( mockApiFetch.mock.calls[ 1 ][ 0 ] ).not.toHaveProperty( 'parse' );
	} );

	it( 'rethrows an error that carries no response', async () => {
		const offline = new TypeError( 'Failed to fetch' );
		mockApiFetch.mockRejectedValue( offline );

		await expect( fetchReport( 'orders/by-date' ) ).rejects.toBe( offline );
	} );
} );
