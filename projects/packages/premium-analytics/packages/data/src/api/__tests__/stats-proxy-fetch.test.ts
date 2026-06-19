/**
 * Internal dependencies
 */
import { getStatsProxyPath } from '../stats-proxy-fetch';

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
} );
