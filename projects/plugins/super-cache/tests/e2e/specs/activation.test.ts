import { describe, beforeAll, expect, test } from '@jest/globals';
import { decodeContainerFile, dockerExec } from '../lib/docker-tools';
import { readPluginFile } from '../lib/plugin-tools';
import { resetEnvironmnt, wpcli } from '../lib/wordpress-tools';

describe( 'Plugin Activation', () => {
	beforeAll( async () => {
		await resetEnvironmnt();
		await wpcli( 'plugin', 'activate', 'wp-super-cache' );
	} );

	test( 'Ensure wp-config.php is updated when activated', async () => {
		const config = await decodeContainerFile( '/var/www/html/wp-config.php' );

		expect( /define\(\s*'WP_CACHE'/.test( config ) ).toBe( true );
		expect( /define\(\s*'WPCACHEHOME'/.test( config ) ).toBe( true );
	} );

	test( 'Ensure advanced-cache is populated correctly.', async () => {
		const advancedCache = await decodeContainerFile(
			'/var/www/html/wp-content/advanced-cache.php'
		);
		const expectedContents = await readPluginFile( 'advanced-cache.php' );

		expect( advancedCache ).toBe( expectedContents );
		expect( advancedCache ).not.toBe( '' );
	} );

	test( 'Ensure a wp-cache-config.php file has been created and appears valid.', async () => {
		const result = await dockerExec( 'php', '-l', '/var/www/html/wp-content/wp-cache-config.php' );

		expect( result ).toContain( 'No syntax errors' );
	} );
} );
