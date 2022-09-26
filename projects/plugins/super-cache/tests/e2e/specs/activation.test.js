const exec = util.promisify( require( 'node:child_process' ).exec );
const fsp = require( 'fs/promises' );
const path = require( 'path' );
const util = require( 'util' );
const shellEscape = require( 'shell-escape' );

/**
 * Run the given command (a string array) in the docker container.
 *
 * @param {...any} command - The command to run.
 */
async function dockerExec( ...command ) {
	const result = await exec(
		shellEscape( [ 'docker', 'exec', '-u', 'www-data', 'super-cache-e2e_wordpress_1', ...command ] )
	);

	return result.stdout;
}

/**
 * Run the given wp-cli command (provided as a string array) in wp-cli in the docker.
 *
 * @param {...any} command - The command to run.
 */
async function wpcli( ...command ) {
	return dockerExec( 'wp', ...command );
}

/**
 * Delete any lines that match the regex from the specified file.
 *
 * @param {string} filename - The file to be filtered.
 * @param {string} regex - A regex (without / / markers) for lines to remove.
 */
async function deleteLinesFromFile( filename, regex ) {
	await dockerExec( 'sed', '-i', `/^${ regex }/d`, filename );
}

/**
 * Deletes the specified file from docker.
 *
 * @param {string} filename - The file to delete.
 */
async function deleteFile( filename ) {
	await dockerExec( 'rm', '-f', filename );
}

/**
 * Returns the contents of the specified file from docker.
 *
 * @param {string} filename - The file to read.
 */
async function readDockerFile( filename ) {
	return dockerExec( 'cat', filename );
}

/**
 * Reset the environment; clear out files created by wp-super-cache, and deactivate the plugin.
 */
async function resetEnvironmnt() {
	await wpcli( 'plugin', 'deactivate', 'wp-super-cache' );
	await deleteLinesFromFile( '/var/www/html/wp-config.php', '(WP_CACHE|WPCACHEHOME)' );
	await deleteFile( '/var/www/html/wp-content/advanced-cache.php' );

	// Make sure tests fail if the env isn't clean.
	expect( /wp-super-cache\sinactive/.test( await wpcli( 'plugin', 'list' ) ) ).toBe( true );

	const config = await dockerExec( 'cat', '/var/www/html/wp-config.php' );
	expect( /define\(\s*'WP_CACHE'/.test( config ) ).toBe( false );
	expect( /define\(\s*'WPCACHEHOME'/.test( config ) ).toBe( false );
}

beforeAll( async () => {
	await resetEnvironmnt();
	await wpcli( 'plugin', 'activate', 'wp-super-cache' );
} );

test( 'Ensure wp-config.php is updated when activated', async () => {
	const config = await readDockerFile( '/var/www/html/wp-config.php' );

	expect( /define\(\s*'WP_CACHE'/.test( config ) ).toBe( true );
	expect( /define\(\s*'WPCACHEHOME'/.test( config ) ).toBe( true );
} );

test( 'Ensure advanced-cache is populated correctly.', async () => {
	const advancedCache = await readDockerFile( '/var/www/html/wp-content/advanced-cache.php' );
	const expectedContents = await fsp.readFile(
		path.join( __dirname, '../../../advanced-cache.php' ),
		'utf8'
	);

	expect( advancedCache ).toBe( expectedContents );
} );

test( 'Ensure a wp-cache-config.php file has been created and appears valid.', async () => {
	const result = await dockerExec( 'php', '-l', '/var/www/html/wp-content/wp-cache-config.php' );

	expect( result ).toContain( 'No syntax errors' );
} );
