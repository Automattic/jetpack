import { expect } from '@jest/globals';
import {
	dockerExec,
	deleteLinesFromDockerFile,
	deleteDockerFile,
	readDockerFile,
} from './docker-tools';

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
	await deleteLinesFromDockerFile( '/var/www/html/wp-config.php', '(WP_CACHE|WPCACHEHOME)' );
	await deleteDockerFile( '/var/www/html/wp-content/advanced-cache.php' );

	// Make sure tests fail if the env isn't clean.
	expect( /wp-super-cache\sinactive/.test( await wpcli( 'plugin', 'list' ) ) ).toBe( true );

	const config = await readDockerFile( '/var/www/html/wp-config.php' );
	expect( /define\(\s*'WP_CACHE'/.test( config ) ).toBe( false );
	expect( /define\(\s*'WPCACHEHOME'/.test( config ) ).toBe( false );
}
