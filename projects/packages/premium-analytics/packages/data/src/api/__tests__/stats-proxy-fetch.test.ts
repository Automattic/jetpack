/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { fetchStatsProxy, getStatsProxyPath } from '../stats-proxy-fetch';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

function mockJsonResponse( body: unknown, status = 200, statusText = 'OK' ) {
	return {
		ok: status >= 200 && status < 300,
		status,
		statusText,
		json: jest.fn().mockResolvedValue( body ),
	};
}

beforeEach( () => {
	mockApiFetch.mockResolvedValue( mockJsonResponse( {} ) as never );
} );

afterEach( () => {
	jest.clearAllMocks();
} );

describe( 'getStatsProxyPath', () => {
	it( 'builds a v1.1 stats proxy path', () => {
		expect(
			getStatsProxyPath( {
				version: '1.1',
				endpoint: 'stats/top-posts',
				params: { period: 'day', date: '2026-06-16' },
			} )
		).toBe( '/jetpack-premium-analytics/v1/proxy/v1.1/stats/top-posts?period=day&date=2026-06-16' );
	} );

	it( 'preserves comma-separated UTM endpoint segments', () => {
		expect(
			getStatsProxyPath( {
				version: '1.1',
				endpoint: 'stats/utm/utm_source,utm_medium',
				params: { period: 'month' },
			} )
		).toBe(
			'/jetpack-premium-analytics/v1/proxy/v1.1/stats/utm/utm_source,utm_medium?period=month'
		);
	} );

	it( 'builds site-less upgrades proxy path', () => {
		expect( getStatsProxyPath( { version: '1.2', endpoint: '/upgrades' } ) ).toBe(
			'/jetpack-premium-analytics/v1/proxy/v1.2/upgrades'
		);
	} );

	it( 'omits nullish query params', () => {
		expect(
			getStatsProxyPath( {
				version: '1.1',
				endpoint: 'stats/visits',
				params: {
					period: 'day',
					date: undefined,
					start_date: null,
				} as never,
			} )
		).toBe( '/jetpack-premium-analytics/v1/proxy/v1.1/stats/visits?period=day' );
	} );
} );

describe( 'fetchStatsProxy', () => {
	it( 'uses GET by default and omits request data', async () => {
		await fetchStatsProxy( {
			version: '1.1',
			endpoint: 'stats/top-posts',
			params: { period: 'day' },
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack-premium-analytics/v1/proxy/v1.1/stats/top-posts?period=day',
			method: 'GET',
			parse: false,
		} );
	} );

	it( 'sends POST bodies as apiFetch data', async () => {
		const body = { modules: [ 'visits' ] };

		await fetchStatsProxy( {
			version: '2',
			endpoint: 'jetpack-stats-dashboard/modules',
			method: 'POST',
			body,
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack-premium-analytics/v1/proxy/v2/jetpack-stats-dashboard/modules',
			method: 'POST',
			parse: false,
			data: body,
		} );
	} );

	it( 'adds the HTTP status to non-2xx API errors', async () => {
		mockApiFetch.mockRejectedValue(
			mockJsonResponse(
				{
					code: 'rest_forbidden',
					message: 'Not allowed.',
				},
				403,
				'Forbidden'
			)
		);

		await expect(
			fetchStatsProxy( {
				version: '1.1',
				endpoint: 'stats/devices/screensize',
				params: { period: 'day' },
			} )
		).rejects.toEqual( {
			code: 'rest_forbidden',
			message: 'Not allowed.',
			status: 403,
		} );
	} );
} );
