const fsp = require( 'fs/promises' );
const path = require( 'path' );
const { readDockerFile, dockerExec } = require( '../lib/docker-tools' );
const { resetEnvironmnt, wpcli } = require( '../lib/wordpress-tools' );

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
