import util from 'util';
import zlib from 'zlib';
import { describe, expect, beforeAll, test } from '@jest/globals';
import { readContainerFile } from '../../lib/docker-tools';
import { updateSettings } from '../../lib/plugin-settings';
import { getAuthCookie } from '../../lib/plugin-tools';
import { loadPage } from '../../lib/test-tools';
import { resetEnvironmnt, wpcli } from '../../lib/wordpress-tools';

const gunzip = util.promisify( zlib.gunzip );

let authCookie: string;

describe( 'cache_compression settings', () => {
	beforeAll( async () => {
		await resetEnvironmnt();
		await wpcli( 'plugin', 'activate', 'wp-super-cache' );

		authCookie = await getAuthCookie();
		await updateSettings( authCookie, {
			wp_cache_enabled: true,
			cache_compression: true,
		} );
	} );

	test( 'caching works correctly', async () => {
		const first = await loadPage();
		const second = await loadPage();

		expect( first ).toBe( second );
		expect( first ).toMatch( /Compression = gzip/ );
	} );

	test( 'cached files are stored gzipped', async () => {
		// Load a page, and strip the WP Super Cache comment from the bottom.
		const rawContent = await loadPage();
		const trimmed = rawContent.replace( '<!-- super cache -->', '' ).trim();

		const gzipped = await readContainerFile(
			'/var/www/html/wp-content/cache/supercache/localhost/index.html.gz'
		);
		const decompressed = ( await gunzip( gzipped ) ).toString().trim();

		expect( trimmed ).toBe( decompressed );
	} );
} );
