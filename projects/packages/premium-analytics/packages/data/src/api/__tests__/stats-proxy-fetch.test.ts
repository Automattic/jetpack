/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { fetchReport, fetchStatsProxy, getStatsProxyPath } from '../stats-proxy-fetch';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

beforeEach( () => {
	mockApiFetch.mockResolvedValue( {} );
} );

afterEach( () => {
	jest.clearAllMocks();
	delete window.JetpackScriptData;
} );

function setSimpleScriptData( blogId = 191664832 ) {
	Object.defineProperty( window, 'JetpackScriptData', {
		configurable: true,
		value: {
			site: {
				host: 'wpcom',
				wpcom: {
					blog_id: blogId,
				},
			},
		},
	} );
}

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

	it( 'builds Simple v1.1 stats paths for the WPCOM apiFetch bridge', () => {
		setSimpleScriptData();

		expect(
			getStatsProxyPath( {
				version: '1.1',
				endpoint: 'stats/location-views/country',
				params: { max: 10, period: 'day' },
			} )
		).toBe( '/rest/v1.1/stats/location-views/country?max=10&period=day' );
	} );

	it( 'builds Simple v2 paths for the WPCOM apiFetch bridge', () => {
		setSimpleScriptData();

		expect(
			getStatsProxyPath( {
				version: '2',
				endpoint: 'analytics/reports/sessions/by-date',
				params: { interval: 'day' },
			} )
		).toBe( '/wpcom/v2/analytics/reports/sessions/by-date?interval=day' );
	} );

	it( 'adds the current Simple site query for global requests', () => {
		setSimpleScriptData( 67890 );

		expect( getStatsProxyPath( { version: '1.2', endpoint: '/upgrades', global: true } ) ).toBe(
			'/rest/v1.2/upgrades?site=67890'
		);
	} );

	it( 'does not overwrite an explicit site query on Simple global requests', () => {
		setSimpleScriptData( 67890 );

		expect(
			getStatsProxyPath( {
				version: '1.2',
				endpoint: '/upgrades',
				params: { site: 41 },
				global: true,
			} )
		).toBe( '/rest/v1.2/upgrades?site=41' );
	} );

	it( 'does not scope a request as global on Simple without opting in', () => {
		setSimpleScriptData( 67890 );

		// No `global: true` — treated as an ordinary site-scoped request even
		// though the endpoint name is `upgrades`, since the resolver no longer
		// infers `global` from the endpoint string.
		expect( getStatsProxyPath( { version: '1.2', endpoint: '/upgrades' } ) ).toBe(
			'/rest/v1.2/upgrades'
		);
	} );

	it( 'throws for a Simple global request with no site to scope to', () => {
		Object.defineProperty( window, 'JetpackScriptData', {
			configurable: true,
			value: { site: { host: 'wpcom' } },
		} );

		expect( () =>
			getStatsProxyPath( { version: '1.2', endpoint: '/upgrades', global: true } )
		).toThrow( /has no site to scope to/ );
	} );

	it( 'does not require a site for a non-Simple global request', () => {
		// Local proxy path is unaffected by `global` — the flag only changes
		// Simple's public-api dispatch, so a missing blog id shouldn't throw here.
		expect( getStatsProxyPath( { version: '1.2', endpoint: '/upgrades', global: true } ) ).toBe(
			'/jetpack-premium-analytics/v1/proxy/v1.2/upgrades'
		);
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
			data: body,
			parse: false,
		} );
	} );

	it( 'uses WPCOM Simple paths directly before apiFetch middleware runs', async () => {
		setSimpleScriptData();

		await fetchStatsProxy( {
			version: '1.1',
			endpoint: 'stats/location-views/country',
			params: { max: 10, period: 'day' },
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/rest/v1.1/stats/location-views/country?max=10&period=day',
			method: 'GET',
			parse: false,
		} );
	} );

	it( 'builds report paths through the local proxy by default', async () => {
		await fetchReport( 'orders/by-date', {
			from: '2026-06-01',
			to: '2026-06-30',
			interval: 'day',
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack-premium-analytics/v1/proxy/v2/analytics/reports/orders/by-date?from=2026-06-01&to=2026-06-30&interval=day',
			method: 'GET',
			parse: false,
		} );
	} );

	it( 'builds Simple report paths for the WPCOM apiFetch bridge', async () => {
		setSimpleScriptData();

		await fetchReport( 'sessions/by-device', { from: '2026-06-01', to: '2026-06-30' } );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/analytics/reports/sessions/by-device?from=2026-06-01&to=2026-06-30',
			method: 'GET',
			parse: false,
		} );
	} );

	it( 'serializes nested report filters into query args', async () => {
		await fetchReport( 'coupons/by-date', {
			from: '2026-06-01',
			to: '2026-06-30',
			filters: [ { key: 'product', compare: 'IN', value: '42' } ],
		} );

		const path = ( mockApiFetch.mock.calls[ 0 ][ 0 ] as { path: string } ).path;
		expect( decodeURIComponent( path ) ).toBe(
			'/jetpack-premium-analytics/v1/proxy/v2/analytics/reports/coupons/by-date?from=2026-06-01&to=2026-06-30&filters[0][key]=product&filters[0][compare]=IN&filters[0][value]=42'
		);
	} );

	it( 'marks WPCOM Simple upgrades requests as global when opted in', async () => {
		setSimpleScriptData( 67890 );

		await fetchStatsProxy( {
			version: '1.2',
			endpoint: 'upgrades',
			global: true,
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/rest/v1.2/upgrades?site=67890',
			method: 'GET',
			global: true,
			parse: false,
		} );
	} );
} );
