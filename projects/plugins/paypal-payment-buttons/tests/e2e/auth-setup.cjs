/**
 * Auth setup — logs into WordPress and saves the storage state for subsequent tests.
 */

const fs = require( 'fs' );
const { test: setup } = require( '@playwright/test' );

setup( 'authenticate as admin', async ( { page } ) => {
	const baseURL = process.env.WP_BASE_URL || 'http://localhost:8889';

	// wp-env default credentials.
	const username = process.env.WP_USERNAME || 'admin';
	const password = process.env.WP_PASSWORD || 'password';

	await page.goto( `${ baseURL }/wp-login.php` );
	await page.fill( '#user_login', username );
	await page.fill( '#user_pass', password );
	await page.click( '#wp-submit' );
	await page.waitForURL( '**/wp-admin/**' );

	// Ensure output directory exists.
	fs.mkdirSync( './output', { recursive: true } );

	await page.context().storageState( { path: './output/storage-state.json' } );
} );
