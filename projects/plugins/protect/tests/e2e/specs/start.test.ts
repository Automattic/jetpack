import { expect, test } from '_jetpack-e2e-commons/fixtures/base-test';
import { connect } from '../flows/connection';
import type { Page } from '@playwright/test';

/**
 * Checks for and then closes the "Changes saved" notice.
 * @param {Page} page - Playwright page object
 */
async function closeChangesSavedNotice( page: Page ) {
	await expect( page.getByText( 'Changes saved' ) ).toBeVisible();
	await page.getByRole( 'button', { name: 'Dismiss notice.' } ).click();
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

		// to do: should not need to manually reload the page here
		//        currently needed to ensure the waf module is available in initial state
		await page.reload();
	} );

	test( 'Jetpack Protect firewall page', async ( { page, admin } ) => {
		await test.step( 'Navigate to firewall page', async () => {
			await admin.visitAdminPage( 'admin.php', 'page=jetpack-protect#/firewall' );
			await expect( page.getByText( 'Firewall is on' ) ).toBeVisible();
		} );

		await test.step( 'Test the brute force protection setting', async () => {
			// Test the setting is present and enabled by default
			const bruteForceToggle = page.locator( '#inspector-toggle-control-1' );
			await expect( page.getByRole( 'heading', { name: 'Brute force protection' } ) ).toBeVisible();
			await expect( bruteForceToggle, 'Brute force protection should be enabled' ).toBeEnabled();
			await expect( bruteForceToggle, 'Brute force protection should be on' ).toBeChecked();

			// Test turning brute force off
			await bruteForceToggle.click();
			await closeChangesSavedNotice( page );
			await expect( bruteForceToggle, 'Brute force protection should be enabled' ).toBeEnabled();
			await expect( bruteForceToggle, 'Brute force protection should be off' ).not.toBeChecked();

			// Test turning brute force on
			await bruteForceToggle.click();
			await closeChangesSavedNotice( page );
			await expect( bruteForceToggle, 'Brute force protection should be enabled' ).toBeEnabled();
			await expect( bruteForceToggle, 'Brute force protection should be on' ).toBeChecked();
		} );

		await test.step( 'Test the IP block list settings', async () => {
			const blockListTextarea = page.locator( '#jetpack_waf_ip_block_list' );
			const blockListToggle = page.locator( '#inspector-toggle-control-2' );

			// Test the default block list state
			await expect( page.getByRole( 'heading', { name: 'Block IP addresses' } ) ).toBeVisible();
			await expect( blockListToggle, 'Block list toggle should be enabled' ).toBeEnabled();
			await expect( blockListToggle, 'Block list should be off' ).not.toBeChecked();

			// Test turning the block list on
			await blockListToggle.click();
			await expect( blockListToggle, 'Block list toggle should be enabled' ).toBeEnabled();
			await expect( blockListToggle, 'Block list should be on' ).toBeChecked();
			await expect( blockListTextarea ).toBeVisible();

			// Test adding an IP address to the block list
			await blockListTextarea.fill( '192.168.1.1' );
			await page.getByRole( 'button', { name: 'Save block list' } ).click();
			await expect( blockListToggle, 'Block list toggle should be enabled' ).toBeEnabled();
			await closeChangesSavedNotice( page );
		} );

		await test.step( 'Test the IP allow list settings', async () => {
			const trustedIPsToggle = page.locator( '#inspector-toggle-control-3' );
			const saveAllowListButton = page.getByRole( 'button', { name: 'Save allow list' } );

			// Validate the default allow list state
			await expect( page.getByRole( 'heading', { name: 'Trusted IP addresses' } ) ).toBeVisible();
			await expect( trustedIPsToggle, 'Trusted IPs toggle should be enabled' ).toBeEnabled();
			await expect( trustedIPsToggle, 'Trusted IPs should be off' ).not.toBeChecked();

			// Test turning the allow list on
			await trustedIPsToggle.click();
			await expect( trustedIPsToggle, 'Trusted IPs toggle should be enabled' ).toBeEnabled();
			await expect( trustedIPsToggle, 'Trusted IPs should be on' ).toBeChecked();

			// Test adding an IP address to the allow list
			await page.locator( '#jetpack_waf_ip_allow_list' ).fill( '192.168.1.1' );
			await saveAllowListButton.click();
			await expect( trustedIPsToggle, 'Trusted IPs toggle should be enabled' ).toBeEnabled();
			await closeChangesSavedNotice( page );
		} );

		await test.step( 'Test the data sharing settings', async () => {
			const basicDataSharingToggle = page.locator( '#inspector-toggle-control-4' );
			const advancedDataSharingToggle = page.locator( '#inspector-toggle-control-5' );

			// Test the default state
			await expect(
				basicDataSharingToggle,
				'Basic data sharing toggle should be enabled'
			).toBeEnabled();
			await expect( basicDataSharingToggle, 'Basic data sharing should be on' ).toBeChecked();
			await expect(
				advancedDataSharingToggle,
				'Advanced data sharing toggle should be enabled'
			).toBeEnabled();
			await expect(
				advancedDataSharingToggle,
				'Advanced data sharing should be off'
			).not.toBeChecked();

			// Test turning basic data sharing off
			await basicDataSharingToggle.click();
			await closeChangesSavedNotice( page );

			// Test turning advanced data sharing on
			await advancedDataSharingToggle.click();
			await closeChangesSavedNotice( page );
			await expect( basicDataSharingToggle, 'Basic data sharing should be on' ).toBeChecked();
			await expect( advancedDataSharingToggle, 'Advanced data sharing should be on' ).toBeChecked();
		} );
	} );
} );
