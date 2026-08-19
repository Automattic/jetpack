import { expect, test } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import { connect } from '../flows/connection';
import type { Locator, Page } from '@playwright/test';

/**
 * Checks for and then closes the "Changes saved" notice.
 * @param {Page} page - Playwright page object
 */
async function closeChangesSavedNotice( page: Page ) {
	await expect( page.getByText( 'Changes saved' ) ).toBeVisible();
	await page.getByRole( 'button', { name: 'Dismiss notice.' } ).click();
}

/**
 * Locate a firewall toggle by the heading text of the section that contains it.
 *
 * The firewall ToggleControls have no visible label and the WP `<label htmlFor>`
 * association is empty, so accessibility-tree based locators (getByRole/getByLabel)
 * don't match reliably. Instead, scope to the Firewall tab panel, then find the
 * smallest containing div that has both the section heading and a checkbox, and
 * return the checkbox inside it.
 *
 * The `has:` filters must use page-rooted locators: Playwright re-roots a `has:`
 * locator at each candidate element, so a panel-rooted locator would search for a
 * nested tab panel inside the candidate div and match nothing.
 * @param {Page}    page        - Playwright page object, for the page-rooted `has:` filters
 * @param {Locator} panel       - Locator for the Firewall tab panel
 * @param {string}  headingName - Visible heading text of the section
 * @return {Locator} Locator for the checkbox in that section
 */
function getToggleBySection( page: Page, panel: Locator, headingName: string ) {
	return panel
		.locator( 'div' )
		.filter( { has: page.getByRole( 'heading', { name: headingName } ) } )
		.filter( { has: page.locator( 'input[type="checkbox"]' ) } )
		.last()
		.locator( 'input[type="checkbox"]' );
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
		// Scope every assertion on this page to the Firewall tab panel. During route
		// transitions the previously active (Scan) tab panel can stay briefly mounted
		// while the Firewall panel mounts, and because every tab panel renders the same
		// react-router <Outlet />, the matched FirewallRoute can appear in two panels at
		// once. Scoping to the Firewall panel keeps each locator matching a single
		// element instead of tripping Playwright strict mode. `exact` avoids matching the
		// "Automatic firewall is on" heading variant. The "Changes saved" notice is left
		// page-scoped on purpose: it renders at the app level, outside the tab panels.
		const firewallPanel = page.getByRole( 'tabpanel', { name: 'Firewall', exact: true } );

		await test.step( 'Navigate to firewall page', async () => {
			await admin.visitAdminPage( 'admin.php', 'page=jetpack-protect#/firewall' );
			await expect(
				firewallPanel.getByRole( 'heading', { name: 'Firewall is on', exact: true } )
			).toBeVisible();

			// The active route renders into exactly one tab panel. Each panel shares the
			// same <Outlet />, so a regression that rendered inactive panels' content
			// (e.g. flipping Tabs.Panel to keepMounted) would duplicate this heading
			// page-wide. Assert page scope, not the panel, to catch that.
			await expect(
				page.getByRole( 'heading', { name: 'Firewall is on', exact: true } )
			).toHaveCount( 1 );
		} );

		await test.step( 'Test the brute force protection setting', async () => {
			// Test the setting is present and enabled by default
			const bruteForceToggle = getToggleBySection( page, firewallPanel, 'Brute force protection' );
			await expect(
				firewallPanel.getByRole( 'heading', { name: 'Brute force protection' } )
			).toBeVisible();
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
			const blockListTextarea = firewallPanel.locator( '#jetpack_waf_ip_block_list' );
			const blockListToggle = getToggleBySection( page, firewallPanel, 'Block IP addresses' );

			// Test the default block list state
			await expect(
				firewallPanel.getByRole( 'heading', { name: 'Block IP addresses' } )
			).toBeVisible();
			await expect( blockListToggle, 'Block list toggle should be enabled' ).toBeEnabled();
			await expect( blockListToggle, 'Block list should be off' ).not.toBeChecked();

			// Test turning the block list on
			await blockListToggle.click();
			await expect( blockListToggle, 'Block list toggle should be enabled' ).toBeEnabled();
			await expect( blockListToggle, 'Block list should be on' ).toBeChecked();
			await expect( blockListTextarea ).toBeVisible();

			// Test adding an IP address to the block list
			await blockListTextarea.fill( '192.168.1.1' );
			await firewallPanel.getByRole( 'button', { name: 'Save block list' } ).click();
			await expect( blockListToggle, 'Block list toggle should be enabled' ).toBeEnabled();
			await closeChangesSavedNotice( page );
		} );

		await test.step( 'Test the IP allow list settings', async () => {
			const trustedIPsToggle = getToggleBySection( page, firewallPanel, 'Trusted IP addresses' );
			const saveAllowListButton = firewallPanel.getByRole( 'button', { name: 'Save allow list' } );

			// Validate the default allow list state
			await expect(
				firewallPanel.getByRole( 'heading', { name: 'Trusted IP addresses' } )
			).toBeVisible();
			await expect( trustedIPsToggle, 'Trusted IPs toggle should be enabled' ).toBeEnabled();
			await expect( trustedIPsToggle, 'Trusted IPs should be off' ).not.toBeChecked();

			// Test turning the allow list on
			await trustedIPsToggle.click();
			await expect( trustedIPsToggle, 'Trusted IPs toggle should be enabled' ).toBeEnabled();
			await expect( trustedIPsToggle, 'Trusted IPs should be on' ).toBeChecked();

			// Test adding an IP address to the allow list
			await firewallPanel.locator( '#jetpack_waf_ip_allow_list' ).fill( '192.168.1.1' );
			await saveAllowListButton.click();
			await expect( trustedIPsToggle, 'Trusted IPs toggle should be enabled' ).toBeEnabled();
			await closeChangesSavedNotice( page );
		} );

		await test.step( 'Test the data sharing settings', async () => {
			const basicDataSharingToggle = firewallPanel.getByRole( 'checkbox', {
				name: 'Share basic data',
			} );
			const advancedDataSharingToggle = firewallPanel.getByRole( 'checkbox', {
				name: 'Share detailed data',
			} );

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
