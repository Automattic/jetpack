import fs from 'fs';
import { test as setup, expect, type Browser } from '@playwright/test';
import { STATE_OFF, STATE_ON, STATE_STANDALONE } from '../../helpers/admin-shell-helper';

/**
 * Log in through wp-login.php and save the session.
 *
 * @param browser  - Browser to log in with.
 * @param url      - Site URL.
 * @param user     - Username.
 * @param password - Password.
 * @param path     - Where to save the storage state.
 */
async function logIn(
	browser: Browser,
	url: string,
	user: string,
	password: string,
	path: string
) {
	const context = await browser.newContext( { ignoreHTTPSErrors: true } );
	const page = await context.newPage();
	await page.goto( new URL( '/wp-login.php', url ).href );
	// Jetpack SSO can put the WordPress.com button first.
	const toggle = page.getByText( 'Log in with username and password' );
	if ( await toggle.isVisible().catch( () => false ) ) {
		await toggle.click();
	}
	// wp-login.php focuses and selects the username field on a timer, which can clobber the fill.
	await expect( async () => {
		await page.locator( '#user_login' ).fill( user );
		await page.locator( '#user_pass' ).fill( password );
		await expect( page.locator( '#user_login' ) ).toHaveValue( user, { timeout: 1000 } );
		await expect( page.locator( '#user_pass' ) ).toHaveValue( password, { timeout: 1000 } );
	} ).toPass( { timeout: 15000 } );
	await page.locator( '#wp-submit' ).click();
	await expect( page.locator( '#wpadminbar' ) ).toBeVisible( { timeout: 60000 } );
	await context.storageState( { path } );
	await context.close();
}

setup( 'log in to the shell-on site', async ( { browser, baseURL } ) => {
	await logIn(
		browser,
		baseURL!,
		process.env.ADMIN_SHELL_USER ?? 'admin',
		process.env.ADMIN_SHELL_PASSWORD ?? 'password',
		STATE_ON
	);
	expect( fs.existsSync( STATE_ON ) ).toBe( true );
} );

setup( 'log in to the shell-off site', async ( { browser } ) => {
	setup.skip( ! process.env.ADMIN_SHELL_OFF_URL, 'ADMIN_SHELL_OFF_URL is not set' );
	await logIn(
		browser,
		process.env.ADMIN_SHELL_OFF_URL!,
		process.env.ADMIN_SHELL_OFF_USER ?? 'admin',
		process.env.ADMIN_SHELL_OFF_PASSWORD ?? 'password',
		STATE_OFF
	);
	expect( fs.existsSync( STATE_OFF ) ).toBe( true );
} );

setup( 'log in to the standalone-only site', async ( { browser } ) => {
	setup.skip( ! process.env.ADMIN_SHELL_STANDALONE_URL, 'ADMIN_SHELL_STANDALONE_URL is not set' );
	await logIn(
		browser,
		process.env.ADMIN_SHELL_STANDALONE_URL!,
		process.env.ADMIN_SHELL_STANDALONE_USER ?? 'admin',
		process.env.ADMIN_SHELL_STANDALONE_PASSWORD ?? 'password',
		STATE_STANDALONE
	);
	expect( fs.existsSync( STATE_STANDALONE ) ).toBe( true );
} );
