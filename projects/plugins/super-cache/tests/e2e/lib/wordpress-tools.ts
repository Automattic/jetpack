import { expect } from '@jest/globals';
import {
	dockerExec,
	deleteLinesFromContainerFile,
	deleteContainerFile,
	readContainerFile,
	writeContainerFile,
} from './docker-tools';
import { readPluginFile } from './plugin-tools';

/**
 * Run the given wp-cli command (provided as a string array) in wp-cli in the docker.
 *
 * @param {...any} command - The command to run.
 */
export async function wpcli( ...command ) {
	return dockerExec( 'wp', ...command );
}

/**
 * Reset the environment; clear out files created by wp-super-cache, and deactivate the plugin.
 */
export async function resetEnvironmnt() {
	await wpcli( 'plugin', 'deactivate', 'wp-super-cache' );
	await deleteContainerFile( '/var/www/html/wp-content/advanced-cache.php' );
	await deleteContainerFile( '/var/www/html/wp-content/wp-content/wp-cache-config.php' );
	await deleteLinesFromContainerFile( '/var/www/html/wp-config.php', 'WPCACHEHOME' );
	await deleteLinesFromContainerFile( '/var/www/html/wp-config.php', 'WP_CACHE' );
	await writeContainerFile(
		'/var/www/html/.htaccess',
		await readPluginFile( 'tests/e2e/tools/htaccess.txt' )
	);

	// Make sure tests fail if the env isn't clean.
	const pluginList = await wpcli( 'plugin', 'list' );
	expect( /wp-super-cache\sinactive/.test( pluginList ) ).toBe( true );

	const config = await readContainerFile( '/var/www/html/wp-config.php' );
	expect( /define\(\s*'WP_CACHE'/.test( config ) ).toBe( false );
	expect( /define\(\s*'WPCACHEHOME'/.test( config ) ).toBe( false );

	const htaccess = await readContainerFile( '/var/www/html/.htaccess' );
	expect( htaccess ).not.toContain( 'WPSuperCache' );
}
