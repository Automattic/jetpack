/**
 * Internal dependencies
 */
import { getWpcomSimpleApiFetchOptions } from '../wpcom-simple-api-fetch';

/**
 * Set minimal script data for WPCOM Simple apiFetch tests.
 *
 * @param blogId - WPCOM blog ID.
 */
function setScriptData( blogId = 12345 ) {
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

afterEach( () => {
	delete window.JetpackScriptData;
} );

describe( 'getWpcomSimpleApiFetchOptions', () => {
	it( 'rewrites v2 proxy requests to wpcom v2 paths', () => {
		expect(
			getWpcomSimpleApiFetchOptions( {
				path: '/jetpack-premium-analytics/v1/proxy/v2/analytics/reports/sessions/by-date?interval=day',
				method: 'GET',
			} )
		).toEqual( {
			path: '/wpcom/v2/analytics/reports/sessions/by-date?interval=day',
			method: 'GET',
		} );
	} );

	it( 'rewrites v1 proxy requests to rest versioned paths', () => {
		expect(
			getWpcomSimpleApiFetchOptions( {
				path: '/jetpack-premium-analytics/v1/proxy/v1.1/stats/visits?period=day',
			} )
		).toEqual( {
			path: '/rest/v1.1/stats/visits?period=day',
		} );
	} );

	it( 'rewrites notices to the WPCOM Stats notices endpoint', () => {
		expect(
			getWpcomSimpleApiFetchOptions( {
				path: '/jetpack-premium-analytics/v1/notices?force_refresh=true',
			} )
		).toEqual( {
			path: '/wpcom/v2/jetpack-stats-dashboard/notices?force_refresh=true',
		} );
	} );

	it( 'leaves non Premium Analytics paths alone', () => {
		const options = { path: '/wp/v2/settings' };

		expect( getWpcomSimpleApiFetchOptions( options ) ).toBe( options );
	} );

	it( 'keeps upgrades global and adds the current site query', () => {
		setScriptData( 67890 );

		expect(
			getWpcomSimpleApiFetchOptions( {
				path: '/jetpack-premium-analytics/v1/proxy/v1.2/upgrades?type=transferred',
			} )
		).toEqual( {
			path: '/rest/v1.2/upgrades?type=transferred&site=67890',
			global: true,
		} );
	} );

	it( 'does not overwrite an explicit upgrades site query', () => {
		setScriptData( 67890 );

		expect(
			getWpcomSimpleApiFetchOptions( {
				path: '/jetpack-premium-analytics/v1/proxy/v1.2/upgrades?site=41',
			} )
		).toEqual( {
			path: '/rest/v1.2/upgrades?site=41',
			global: true,
		} );
	} );
} );
