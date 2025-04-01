import { prerequisitesBuilder } from '_jetpack-e2e-commons/env/prerequisites.js';
import { expect, test } from '_jetpack-e2e-commons/fixtures/base-test.js';
import {
	BASE_DOCKER_CMD,
	execSyncShellCommand,
	execWpCommand,
} from '_jetpack-e2e-commons/helpers/utils-helper.js';
import { connect } from '../flows/connection';

test.describe( 'Jetpack Protect Plugin', () => {
	test.beforeEach( async ( { page, admin } ) => {
		await prerequisitesBuilder( page )
			.withCleanEnv()
			.withActivePlugins( [ 'protect' ] )
			.withInactivePlugins( [ 'e2e-waf-data-interceptor' ] )
			.withLoggedIn( true )
			.build();

		/**
		 * Connect the site via the initial setup page's "start for free" option.
		 */
		await connect( page, admin );

		/**
		 * Ensure the WAF rules are generated ahead of time, and
		 * enforce compatible permissions for the E2E environment.
		 */
		await execWpCommand( 'jetpack-waf generate_rules' );
		execSyncShellCommand(
			`${ BASE_DOCKER_CMD } exec-silent -- chown -R www-data:www-data /var/www/html/wp-content/jetpack-waf`
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
			await expect( bruteForceToggle ).toBeEnabled();
			await expect( bruteForceToggle ).toBeChecked();

			// Test turning brute force off
			await bruteForceToggle.click();
			await expect( page.getByText( 'Changes saved' ) ).toBeVisible();
			await expect( bruteForceToggle ).toBeEnabled();
			await expect( bruteForceToggle ).not.toBeChecked();

			// Test turning brute force on
			await bruteForceToggle.click();
			await expect( page.getByText( 'Changes saved' ) ).toBeVisible();
			await expect( bruteForceToggle ).toBeEnabled();
			await expect( bruteForceToggle ).toBeChecked();
		} );

		await test.step( 'Test the IP block list settings', async () => {
			const blockListTextarea = page.locator( '#jetpack_waf_ip_block_list' );
			const blockListToggle = page.locator( '#inspector-toggle-control-2' );

			// Test the default block list state
			await expect( page.getByRole( 'heading', { name: 'Block IP addresses' } ) ).toBeVisible();
			await expect( blockListToggle ).toBeEnabled();
			await expect( blockListToggle ).not.toBeChecked();

			// Test turning the block list on
			await blockListToggle.click();
			await expect( blockListToggle ).toBeEnabled();
			await expect( blockListToggle ).toBeChecked();
			await expect( blockListTextarea ).toBeVisible();

			// Test adding an IP address to the block list
			await blockListTextarea.fill( '192.168.1.1' );
			await page.getByRole( 'button', { name: 'Save block list' } ).click();
			await expect( blockListToggle ).toBeEnabled();
			await expect( page.getByText( 'Changes saved' ) ).toBeVisible();
		} );

		await test.step( 'Test the IP allow list settings', async () => {
			const trustedIPsToggle = page.locator( '#inspector-toggle-control-3' );
			const allowListTextarea = page.locator( '#jetpack_waf_ip_allow_list' );
			const saveAllowListButton = page.getByRole( 'button', { name: 'Save allow list' } );

			// Validate the default allow list state
			await expect( page.getByRole( 'heading', { name: 'Trusted IP addresses' } ) ).toBeVisible();
			await expect( trustedIPsToggle ).toBeEnabled();
			await expect( trustedIPsToggle ).not.toBeChecked();

			// Test turning the allow list on
			await trustedIPsToggle.click();
			await expect( trustedIPsToggle ).toBeEnabled();
			await expect( trustedIPsToggle ).toBeChecked();
			await expect( allowListTextarea ).toBeVisible();

			// Test adding an IP address to the allow list
			await allowListTextarea.fill( '192.168.1.1' );
			await saveAllowListButton.click();
			await expect( trustedIPsToggle ).toBeEnabled();
			await expect( page.getByText( 'Changes saved' ) ).toBeVisible();
		} );

		await test.step( 'Test the data sharing settings', async () => {
			const basicDataSharingToggle = page.locator( '#inspector-toggle-control-4' );
			const advancedDataSharingToggle = page.locator( '#inspector-toggle-control-5' );

			// Test the default state
			await expect( basicDataSharingToggle ).toBeEnabled();
			await expect( basicDataSharingToggle ).toBeChecked();
			await expect( advancedDataSharingToggle ).toBeEnabled();
			await expect( advancedDataSharingToggle ).not.toBeChecked();

			// Test turning basic data sharing off
			await basicDataSharingToggle.click();
			await expect( page.getByText( 'Changes saved' ) ).toBeVisible();

			// Test turning advanced data sharing on
			await advancedDataSharingToggle.click();
			await expect( page.getByText( 'Changes saved' ) ).toBeVisible();
			await expect( basicDataSharingToggle ).toBeChecked();
			await expect( advancedDataSharingToggle ).toBeChecked();
		} );
	} );
} );
