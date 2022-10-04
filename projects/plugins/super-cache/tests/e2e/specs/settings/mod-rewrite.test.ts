import { describe, expect, beforeAll, test } from '@jest/globals';
import { decodeContainerFile } from '../../lib/docker-tools';
import { ModRewriteOptions, updateSettings } from '../../lib/plugin-settings';
import {
	authenticatedRequest,
	clearCache,
	getAuthCookie,
	getSiteUrl,
} from '../../lib/plugin-tools';
import { loadPage } from '../../lib/test-tools';
import { resetEnvironmnt, wpcli } from '../../lib/wordpress-tools';

let authCookie: string;

describe( 'cache behavior with mod_rewrite enabled', () => {
	beforeAll( async () => {
		await resetEnvironmnt();
		await wpcli( 'plugin', 'activate', 'wp-super-cache' );

		authCookie = await getAuthCookie();
		await updateSettings( authCookie, {
			wp_cache_enabled: true,
			wp_cache_mod_rewrite: ModRewriteOptions.On,
		} );
	} );

	test( 'updates mod_rewrite rules', async () => {
		const rules = await decodeContainerFile( '/var/www/html/.htaccess' );

		expect( rules ).toContain( '# BEGIN WPSuperCache' );
		expect( rules ).toContain( '# END WPSuperCache' );
		expect( rules ).toContain(
			'RewriteRule ^(.*) "/wp-content/cache/supercache/%{SERVER_NAME}/$1/index.html" [L]'
		);
	} );

	test( 'caches URLs with no get parameters', async () => {
		const first = await loadPage();
		const second = await loadPage();

		expect( first ).toBe( second );
	} );

	test( 'logged in users do not get cached pages', async () => {
		const url = getSiteUrl();

		const first = await authenticatedRequest( authCookie, 'GET', url );
		const second = await authenticatedRequest( authCookie, 'GET', url );

		expect( first ).not.toBe( second );
	} );

	test( 'GET parameters should affect caching', async () => {
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

	test( 'removes mod_rewrite rules when turned off', async () => {
		await updateSettings( authCookie, {
			wp_cache_mod_rewrite: ModRewriteOptions.Off,
		} );

		const rules = await decodeContainerFile( '/var/www/html/.htaccess' );
		expect( rules ).not.toContain( 'cache/supercache' );

		// Return things to the state other tests expect.
		await updateSettings( authCookie, {
			wp_cache_mod_rewrite: ModRewriteOptions.On,
		} );
	} );
} );
