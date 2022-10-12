import { describe, expect, beforeAll, test } from '@jest/globals';
import { updateSettings } from '../lib/plugin-settings';
import { authenticatedRequest, clearCache, getAuthCookie, getSiteUrl } from '../lib/plugin-tools';
import { loadPage } from '../lib/test-tools';
import { resetEnvironmnt, wpcli } from '../lib/wordpress-tools';

describe( 'cache behavior with default settings', () => {
	beforeAll( async () => {
		await resetEnvironmnt();
		await wpcli( 'plugin', 'activate', 'wp-super-cache' );
		await updateSettings( await getAuthCookie(), {
			wp_cache_enabled: true,
		} );
	} );

	test( 'caches URLs with no get parameters', async () => {
		const first = await loadPage();
		const second = await loadPage();

		expect( first ).toBe( second );
	} );

	test( 'logged in users do not get cached pages', async () => {
		const cookie = await getAuthCookie();
		const url = getSiteUrl();

		const first = await authenticatedRequest( cookie, 'GET', url );
		const second = await authenticatedRequest( cookie, 'GET', url );

		expect( first ).not.toBe( second );
	} );

	test( 'pages with identical GET parameters should cache together', async () => {
		const first = await loadPage( '/', { s: 'potato' } );
		const second = await loadPage( '/', { s: 'potato' } );

		expect( first ).toBe( second );
	} );

	test( 'pages with different GET parameters should not cache together', async () => {
		const first = await loadPage( '/', { s: 'squid' } );
		const second = await loadPage( '/', { s: 'potato' } );

		expect( first ).not.toBe( second );
	} );

	test( 'tracking GET parameters should affect caching', async () => {
		const first = await loadPage( '/', { utm_source: 'test' } );
		const second = await loadPage( '/', { fbclid: 'test' } );

		expect( first ).not.toBe( second );
	} );

	test( 'double slash at the start of URLs should not break URL processing', async () => {
		const first = await loadPage( '//', { s: 'squid' } );
		const second = await loadPage( '//' );

		expect( first ).not.toBe( second );
	} );

	test( 'clears the cache', async () => {
		const first = await loadPage();
		await clearCache();
		const second = await loadPage();

		expect( first ).not.toBe( second );
	} );
} );
