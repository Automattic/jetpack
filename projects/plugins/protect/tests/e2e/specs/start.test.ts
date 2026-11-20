import { expect, test } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import { connect } from '../flows/connection';
import type { Locator, Page } from '@playwright/test';

const SETTINGS_PATH = 'jetpack/v4/protect-dashboard/settings';
const WAF_PATH = 'jetpack/v4/waf';

/**
 * Wait for a settings save to the given REST route to succeed.
 *
 * @param {Page}   page - Playwright page object
 * @param {string} path - REST route the save posts to
 * @return {Promise<void>} Resolves once the save responded successfully.
 */
async function expectSaved( page: Page, path: string ) {
	// apiFetch may send `?rest_route=` with the route encoded, so match on the decoded URL.
	const response = await page.waitForResponse(
		res => res.request().method() === 'POST' && decodeURIComponent( res.url() ).includes( path )
	);
	expect( response.ok(), `Saving to ${ path } should succeed` ).toBe( true );
}

/**
 * Turn a settings toggle on or off and wait for the save, skipping it when it's already there.
 *
 * @param {Page}    page   - Playwright page object
 * @param {Locator} toggle - The switch or checkbox
 * @param {boolean} on     - Whether it should end up on
 * @param {string}  path   - REST route the toggle saves to
 */
async function setToggle( page: Page, toggle: Locator, on: boolean, path = SETTINGS_PATH ) {
	await expect( toggle ).toBeEnabled();
	if ( ( await toggle.isChecked() ) === on ) {
		return;
	}
	const saved = expectSaved( page, path );
	await toggle.click();
	await saved;
	// The toggle is disabled while its save is in flight.
	await expect( toggle ).toBeEnabled();
	await expect( toggle ).toBeChecked( { checked: on } );
}

/**
 * Reload the Settings tab and wait for the saved settings to load.
 *
 * @param {Page} page - Playwright page object
 */
async function reloadSettings( page: Page ) {
	await page.reload();
	await expect( page.getByRole( 'tab', { name: 'Settings', selected: true } ) ).toBeVisible();
	await expect( page.getByRole( 'switch', { name: 'Enable firewall' } ) ).toBeEnabled();
}

test.describe( 'Jetpack Protect Plugin', () => {
	test.beforeEach( async ( { page, admin, testUtils } ) => {
		await testUtils.disconnect();
		await testUtils.executeWpCommand( 'plugin activate jetpack-protect' );
		await testUtils.executeWpCommand( 'plugin deactivate e2e-waf-data-interceptor' );

		/**
		 * Connect the site via the initial setup page's "start for free" option.
		 */
		await connect( page, admin );

		/**
		 * Ensure the WAF rules are generated ahead of time, and
		 * enforce compatible permissions for the E2E environment.
		 */
		await testUtils.executeWpCommand( 'jetpack-waf generate_rules' );
		await testUtils.executeContainerCommand(
			'exec-silent -- chown -R www-data:www-data /var/www/html/wp-content/jetpack-waf'
		);
	} );

	test( 'Jetpack Protect dashboard settings', async ( { page, admin }, testInfo ) => {
		// Cards are `<section aria-label>`, and both cards have an "Always allowed IP addresses" field.
		const firewallCard = page.getByRole( 'region', { name: 'Firewall', exact: true } );
		const loginCard = page.getByRole( 'region', { name: 'Login protection', exact: true } );
		// A different address per retry, so a retry still has an unsaved change to save.
		const ip = `192.0.2.${ 10 + testInfo.retry }`;

		await test.step( 'The connected site gets the shared dashboard', async () => {
			// Connecting happens in the setup app; the shared dashboard takes over on the next load.
			await page.reload();
			await expect( page.getByRole( 'tab', { name: 'Overview' } ) ).toBeVisible();
			await expect( page.getByRole( 'tab', { name: 'Settings' } ) ).toBeVisible();
			await expect( page.locator( '#jetpack-protect-root' ) ).toHaveCount( 0 );
		} );

		await test.step( 'Open the Settings tab', async () => {
			await admin.visitAdminPage(
				'admin.php',
				`page=jetpack-protect&p=${ encodeURIComponent( '/?tab=settings' ) }`
			);
			await expect( page.getByRole( 'tab', { name: 'Settings', selected: true } ) ).toBeVisible();
			await expect(
				firewallCard.getByRole( 'switch', { name: 'Enable firewall' } ),
				'Firewall should be on'
			).toBeChecked();
		} );

		await test.step( 'Login protection persists', async () => {
			const toggle = loginCard.getByRole( 'switch', {
				name: 'Block repeated failed login attempts',
			} );

			await setToggle( page, toggle, false );
			await reloadSettings( page );
			await expect( toggle, 'Login protection should stay off' ).not.toBeChecked();

			await setToggle( page, toggle, true );
			await reloadSettings( page );
			await expect( toggle, 'Login protection should stay on' ).toBeChecked();
		} );

		await test.step( 'IP block list persists', async () => {
			// Each IP list has its own Save button, so scope to the list's row.
			const row = firewallCard
				.locator( '.jp-protect-card__row' )
				.filter( { hasText: 'Block these IP addresses' } );
			const toggle = row.getByRole( 'switch', { name: 'Block these IP addresses' } );
			const list = row.getByRole( 'textbox', { name: 'Blocked IP addresses' } );

			await setToggle( page, toggle, true );
			await list.fill( ip );
			const saved = expectSaved( page, SETTINGS_PATH );
			await row.getByRole( 'button', { name: 'Save', exact: true } ).click();
			await saved;

			await reloadSettings( page );
			await expect( toggle, 'Block list should stay on' ).toBeChecked();
			await expect( list ).toHaveValue( ip );
		} );

		await test.step( 'IP allow list persists', async () => {
			const row = firewallCard
				.locator( '.jp-protect-card__row' )
				.filter( { hasText: 'Always allowed IP addresses' } );
			const toggle = row.getByRole( 'switch', { name: 'Always allowed IP addresses' } );
			const list = row.getByRole( 'textbox', { name: 'Always allowed IP addresses' } );

			await setToggle( page, toggle, true );
			await list.fill( ip );
			const saved = expectSaved( page, SETTINGS_PATH );
			await row.getByRole( 'button', { name: 'Save', exact: true } ).click();
			await saved;

			await reloadSettings( page );
			await expect( toggle, 'Allow list should stay on' ).toBeChecked();
			await expect( list ).toHaveValue( ip );
		} );

		await test.step( 'Data sharing persists', async () => {
			const basic = firewallCard.getByRole( 'checkbox', { name: 'Share basic data with Jetpack' } );
			const detailed = firewallCard.getByRole( 'checkbox', {
				name: 'Share detailed data with Jetpack',
			} );

			// Turning basic sharing off also turns detailed sharing off.
			await setToggle( page, basic, false, WAF_PATH );
			await reloadSettings( page );
			await expect( basic, 'Basic data sharing should stay off' ).not.toBeChecked();
			await expect( detailed, 'Detailed data sharing should stay off' ).not.toBeChecked();

			// Turning detailed sharing on also turns basic sharing on.
			await setToggle( page, detailed, true, WAF_PATH );
			await reloadSettings( page );
			await expect( basic, 'Basic data sharing should stay on' ).toBeChecked();
			await expect( detailed, 'Detailed data sharing should stay on' ).toBeChecked();
		} );
	} );
} );
