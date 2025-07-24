import { test, expect } from '_jetpack-e2e-commons/fixtures/base-test.ts';
import { execWpCommand } from '_jetpack-e2e-commons/helpers/utils-helper.js';
import playwrightConfig from '_jetpack-e2e-commons/playwright.config.mjs';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites.js';
import { JetpackBoostPage } from '../../lib/pages/index.js';

/* global Jetpack_Boost */

test.describe( 'Cornerstone Pages', () => {
	let page;

	test.beforeAll( async ( { browser } ) => {
		page = await browser.newPage( playwrightConfig.use );
		await boostPrerequisitesBuilder( page )
			.withCleanEnv()
			.withMockConnection( true )
			.withSpeedScoreMocked( true )
			.build();
	} );

	test.afterAll( async () => {
		await page.close();
	} );

	test.beforeEach( async () => {
		// Reset cornerstone pages before each test to ensure atomicity
		// Using option delete ensures the system properly initializes an empty array
		await execWpCommand( 'option delete jetpack_boost_ds_cornerstone_pages_list' );
	} );

	test( 'Cornerstone Pages panel should be visible and toggleable', async () => {
		const jetpackBoostPage = await JetpackBoostPage.visit( page );

		// Test panel toggle functionality - title should be visible but content should be collapsed
		const panelToggle = page.locator( 'text=Cornerstone Pages' ).first();
		await expect( panelToggle, 'Panel title should be visible' ).toBeVisible();

		// Panel content should NOT be visible initially (collapsed by default)
		expect(
			await jetpackBoostPage.isCornerstonePagesContentVisible(),
			'Cornerstone Pages content should be collapsed by default'
		).toBeFalsy();

		// Test opening the panel
		await panelToggle.click();

		expect(
			await jetpackBoostPage.isCornerstonePagesContentVisible(),
			'Panel content should be visible when opened'
		).toBeTruthy();
	} );

	test( 'Should display predefined pages (homepage) correctly', async () => {
		const jetpackBoostPage = await JetpackBoostPage.visit( page );

		// Open the panel
		await jetpackBoostPage.openCornerstonePagesPanel();

		// Check that homepage is listed in predefined pages
		const homeUrl = await page.evaluate( () => Jetpack_Boost.site.url );
		await expect(
			page.locator( `text=${ homeUrl }` ).first(),
			'Homepage should be listed in predefined pages'
		).toBeVisible();

		// Check the homepage label
		await expect(
			page.locator( 'text=Homepage:' ),
			'Homepage label should be visible'
		).toBeVisible();
	} );

	test( 'Should allow adding valid custom cornerstone pages on free plan', async () => {
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		await jetpackBoostPage.openCornerstonePagesPanel();

		const testUrl = '/test-page';
		await jetpackBoostPage.addCornerstonePage( testUrl );

		// Wait for save success notice
		await jetpackBoostPage.waitForNotice( 'Cornerstone pages saved' );

		// Verify the page was added (should show "Homepage + 1 page" in the title summary)
		await expect(
			page.locator( 'text=Homepage + 1 page' ),
			'Should display correct page count in summary'
		).toBeVisible();
	} );

	test( 'Should validate URLs correctly and show error messages', async () => {
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		await jetpackBoostPage.openCornerstonePagesPanel();

		// Test invalid URL (different site)
		await jetpackBoostPage.enterCornerstonePageUrl( 'https://example.com/test' );
		await expect(
			page.locator( 'text=The URL seems to be a different site' ),
			'Should show error for different site URL'
		).toBeVisible();

		// Test homepage URL (should be rejected)
		const homeUrl = await page.evaluate( () => Jetpack_Boost.site.url );
		await jetpackBoostPage.clearCornerstonePageInput();
		await jetpackBoostPage.enterCornerstonePageUrl( homeUrl );
		await expect(
			page.locator( 'text=The homepage does not need to be added' ),
			'Should show error for homepage URL'
		).toBeVisible();

		// Clear the input for next tests
		await jetpackBoostPage.clearCornerstonePageInput();
	} );

	test( 'Should enforce free plan limit of 1 custom page', async () => {
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		await jetpackBoostPage.openCornerstonePagesPanel();

		// Try to add 2 pages (should fail on free plan)
		const testUrls = '/test-page-1\n/test-page-2';
		await jetpackBoostPage.enterCornerstonePageUrl( testUrls );

		await expect(
			page.locator( 'text=You can add only 1 cornerstone page URL' ),
			'Should show limit error for free plan'
		).toBeVisible();

		// Verify save button is disabled
		expect(
			await jetpackBoostPage.isCornerstoneSaveButtonDisabled(),
			'Save button should be disabled with validation error'
		).toBeTruthy();
	} );

	test( 'Should allow adding up to 10 pages on premium plan', async () => {
		// Mock premium features using the new plugin approach
		await boostPrerequisitesBuilder( page )
			.withPremiumFeaturesMocked( [ 'cornerstone-10-pages' ] )
			.build();

		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		await jetpackBoostPage.openCornerstonePagesPanel();

		// Verify that premium features are detected
		expect(
			await jetpackBoostPage.isPremiumFeatureDetected(),
			'Premium features should be detected by the frontend'
		).toBeTruthy();

		// Add 10 pages
		const tenPages = Array.from( { length: 10 }, ( _, i ) => `/page-${ i + 1 }` ).join( '\n' );
		await jetpackBoostPage.addCornerstonePage( tenPages );

		// Wait for save success notice
		await jetpackBoostPage.waitForNotice( 'Cornerstone pages saved' );

		// Verify the pages were added
		await expect(
			page.locator( 'text=Homepage + 10 pages' ),
			'Should display correct page count in summary for 10 pages'
		).toBeVisible();
	} );

	test( 'Should enforce premium plan limit of 10 custom pages', async () => {
		// Mock premium features using the new plugin approach
		await boostPrerequisitesBuilder( page )
			.withPremiumFeaturesMocked( [ 'cornerstone-10-pages' ] )
			.build();

		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		await jetpackBoostPage.openCornerstonePagesPanel();

		// Try to add 11 pages
		const elevenPages = Array.from( { length: 11 }, ( _, i ) => `/page-${ i + 1 }` ).join( '\n' );
		await jetpackBoostPage.enterCornerstonePageUrl( elevenPages );

		await expect(
			page.locator( 'text=You can add up to 10 cornerstone page URLs' ),
			'Should show limit error for premium plan'
		).toBeVisible();

		// Verify save button is disabled
		expect(
			await jetpackBoostPage.isCornerstoneSaveButtonDisabled(),
			'Save button should be disabled with validation error'
		).toBeTruthy();
	} );

	test( 'Should show upgrade CTA for premium features on free plan', async () => {
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		await jetpackBoostPage.openCornerstonePagesPanel();

		expect(
			await jetpackBoostPage.isCornerstoneUpgradeCTAVisible(),
			'Upgrade CTA should be visible on free plan'
		).toBeTruthy();

		await expect(
			page.locator( 'text=Premium users can add up to 10 cornerstone pages' ),
			'Should show premium limit in upgrade message'
		).toBeVisible();
	} );

	test( 'Should show load default pages functionality', async () => {
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		await jetpackBoostPage.openCornerstonePagesPanel();

		// Check that load default button exists
		await expect(
			page.locator( 'text=Load default pages' ),
			'Load default pages button should be visible'
		).toBeVisible();

		// Test load default pages functionality (if there are default pages configured)
		const loadDefaultButton = page.locator( 'text=Load default pages' );
		if ( await loadDefaultButton.isEnabled() ) {
			await loadDefaultButton.click();
			// Should show some default pages loaded
			expect(
				await jetpackBoostPage.getCornerstonePageInputValue(),
				'Should have some content after loading defaults'
			).toBeTruthy();
		}
	} );

	test( 'Prerender toggle should be visible when speculation_rules module is available', async () => {
		// Activate speculation_rules module
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'speculation_rules' ] ).build();

		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		await jetpackBoostPage.openCornerstonePagesPanel();

		expect(
			await jetpackBoostPage.isPrerenderToggleVisible(),
			'Prerender toggle should be visible when speculation_rules is available'
		).toBeTruthy();

		await expect(
			page.locator( 'text=Prerender Cornerstone Pages' ),
			'Prerender section title should be visible'
		).toBeVisible();

		// Test toggle functionality
		await jetpackBoostPage.togglePrerenderOption( true );
		await jetpackBoostPage.waitForNotice( 'Prerender enabled' );

		await jetpackBoostPage.togglePrerenderOption( false );
		await jetpackBoostPage.waitForNotice( 'Prerender disabled' );
	} );

	test( 'Prerender toggle should not be visible when speculation_rules module is unavailable', async () => {
		// Deactivate speculation_rules module
		await boostPrerequisitesBuilder( page ).withInactiveModules( [ 'speculation_rules' ] ).build();

		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		await jetpackBoostPage.openCornerstonePagesPanel();

		expect(
			await jetpackBoostPage.isPrerenderToggleVisible(),
			'Prerender toggle should not be visible when speculation_rules is unavailable'
		).toBeFalsy();
	} );

	test( 'Should handle relative URLs correctly', async () => {
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		await jetpackBoostPage.openCornerstonePagesPanel();

		// Test relative URL (should work)
		const relativeUrl = '/about-us';
		await jetpackBoostPage.clearCornerstonePageInput();
		await jetpackBoostPage.addCornerstonePage( relativeUrl );

		// Wait for save success notice
		await jetpackBoostPage.waitForNotice( 'Cornerstone pages saved' );

		// Verify it was saved properly
		await expect(
			page.locator( 'text=Homepage + 1 page' ),
			'Should accept and save relative URLs'
		).toBeVisible();
	} );

	test( 'Should trigger Critical CSS regeneration when pages are updated for premium users', async () => {
		// Mock premium features and activate critical_css module
		await boostPrerequisitesBuilder( page )
			.withPremiumFeaturesMocked( [ 'cornerstone-10-pages' ] )
			.withActiveModules( [ 'critical_css' ] )
			.build();

		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		await jetpackBoostPage.openCornerstonePagesPanel();

		// Add a page (this should trigger CSS regeneration for premium users)
		await jetpackBoostPage.addCornerstonePage( '/premium-test-page' );

		// Wait for save notice
		await jetpackBoostPage.waitForNotice( 'Cornerstone pages saved' );

		// Navigate to main page to check if Critical CSS regeneration was triggered
		// Note: The exact UI for this might vary, but we should see regeneration activity
		expect(
			await jetpackBoostPage.isCriticalCssMetaVisible(),
			'Critical CSS meta should be visible after cornerstone pages update'
		).toBeTruthy();
	} );

	test( 'Should persist cornerstone pages across page reloads', async () => {
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		await jetpackBoostPage.openCornerstonePagesPanel();

		const testUrl = '/persistent-page';
		await jetpackBoostPage.addCornerstonePage( testUrl );
		await jetpackBoostPage.waitForNotice( 'Cornerstone pages saved' );

		// Reload the page
		await page.reload();
		const jetpackBoostPageReloaded = await JetpackBoostPage.visit( page );
		await jetpackBoostPageReloaded.openCornerstonePagesPanel();

		// Check that the page is still there
		const inputValue = await jetpackBoostPageReloaded.getCornerstonePageInputValue();
		expect(
			inputValue.includes( testUrl ),
			'Cornerstone pages should persist across page reloads'
		).toBeTruthy();
	} );

	test( 'Should show correct summary in panel title based on number of pages', async () => {
		const jetpackBoostPage = await JetpackBoostPage.visit( page );

		// Should show "Added: Homepage" when no custom pages
		await expect(
			page.locator( 'text=Added: Homepage' ),
			'Should show only homepage when no custom pages'
		).toBeVisible();

		await jetpackBoostPage.openCornerstonePagesPanel();
		await jetpackBoostPage.addCornerstonePage( '/test-summary' );
		await jetpackBoostPage.waitForNotice( 'Cornerstone pages saved' );

		// Should show "Added: Homepage + 1 page"
		await expect(
			page.locator( 'text=Added: Homepage + 1 page' ),
			'Should show correct count with 1 custom page'
		).toBeVisible();
	} );
} );
