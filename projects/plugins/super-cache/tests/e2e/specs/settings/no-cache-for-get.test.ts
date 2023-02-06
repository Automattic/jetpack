import { describe, expect, beforeAll, test } from '@jest/globals';
import { updateSettings } from '../../lib/plugin-settings';
import { getAuthCookie } from '../../lib/plugin-tools';
import { loadPage } from '../../lib/test-tools';
import { resetEnvironmnt, wpcli } from '../../lib/wordpress-tools';

let authCookie: string;

describe( 'wp_cache_no_cache_for_get settings', () => {
	beforeAll( async () => {
		await resetEnvironmnt();
		await wpcli( 'plugin', 'activate', 'wp-super-cache' );

		authCookie = await getAuthCookie();
		await updateSettings( authCookie, {
			wp_cache_enabled: true,
			wp_cache_no_cache_for_get: true,
		} );
	} );

	test( 'caches URLs with no get parameters', async () => {
		const first = await loadPage();
		const second = await loadPage();

		expect( first ).toBe( second );
	} );

	test( 'does not cache URLs with get parameters', async () => {
		const first = await loadPage( '/', { s: 'potato' } );
		const second = await loadPage( '/', { s: 'potato' } );

		expect( first ).not.toBe( second );
	} );
} );
