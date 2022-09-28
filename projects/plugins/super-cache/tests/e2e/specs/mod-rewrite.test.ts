import { describe, expect, beforeAll, test } from '@jest/globals';
import { readDockerFile } from '../lib/docker-tools';
import { ModRewriteOptions, updateSettings } from '../lib/plugin-settings';
import { clearCache, getAuthCookie } from '../lib/plugin-tools';
import { loadPage } from '../lib/test-tools';
import { resetEnvironmnt, wpcli } from '../lib/wordpress-tools';

describe( 'cache behavior with mod_rewrite enabled', () => {
	beforeAll( async () => {
		await resetEnvironmnt();
		await wpcli( 'plugin', 'activate', 'wp-super-cache' );
		await updateSettings( await getAuthCookie(), {
			wp_cache_enabled: true,
			wp_cache_mod_rewrite: ModRewriteOptions.Expert,
		} );
	} );

	test( 'updates mod_rewrite rules', async () => {
		const rules = await readDockerFile( '/var/www/html/.htaccess' );

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
} );
