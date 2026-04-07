import { test, expect } from '../../lib/fixtures/test';

declare global {
	interface Window {
		Jetpack_Boost: {
			site: {
				url: string;
			};
		};
	}
}

test.describe( 'Cornerstone Pages', () => {
	test.beforeAll( async ( { boostUtils } ) => {
		await boostUtils.resetEnvironment();
		await boostUtils.mockConnection();
		await boostUtils.mockSpeedScore();
	} );

	test.beforeEach( async ( { jetpackBoostPage } ) => {
		await jetpackBoostPage.visit();
	} );

	test.afterEach( async ( { boostUtils } ) => {
		await boostUtils.unMockPremiumFeatures();
		// Reset cornerstone pages before each test to ensure atomicity
		// Using option delete ensures the system properly initializes an empty array
		await boostUtils.executeWpCommand( 'option delete jetpack_boost_ds_cornerstone_pages_list' );
	} );

	test.afterAll( async ( { boostUtils } ) => {
		await boostUtils.unMockConnection();
		await boostUtils.unMockSpeedScore();
	} );

	test( 'Cornerstone Pages panel should be visible and toggleable', async ( {
		jetpackBoostPage,
		page,
	} ) => {
		// Test panel toggle functionality - title should be visible but content should be collapsed
		const panelToggle = page.getByRole( 'button', { name: 'Cornerstone Pages' } ).first();
		await expect( panelToggle, 'Panel title should be visible' ).toBeVisible();

		// Panel content should NOT be visible initially (collapsed by default)
		await expect(
			page.getByText( 'List the most important pages' ),
			'Cornerstone Pages content should be collapsed by default'
		).toBeHidden();

		// Open the panel
		await jetpackBoostPage.openCornerstonePagesPanel();

		await expect(
			page.getByText( 'List the most important pages' ),
			'Panel content should be visible when opened'
		).toBeVisible();
	} );

	test( 'Should display predefined pages (homepage) correctly', async ( {
		jetpackBoostPage,
		page,
	} ) => {
		// Open the panel
		await jetpackBoostPage.openCornerstonePagesPanel();

		// Check that homepage is listed in predefined pages
		const homeUrl = await page.evaluate( () => window.Jetpack_Boost.site.url );
		await expect(
			page.locator( `text=${ homeUrl }` ).first(),
			'Homepage should be listed in predefined pages'
		).toBeVisible();

		// Check the homepage label
		await expect( page.getByText( 'Homepage:' ), 'Homepage label should be visible' ).toBeVisible();
	} );

	test( 'Should allow adding valid custom cornerstone pages on free plan', async ( {
		jetpackBoostPage,
		page,
	} ) => {
		await jetpackBoostPage.openCornerstonePagesPanel();

		const testUrl = '/test-page';
		await jetpackBoostPage.addCornerstonePage( testUrl );

		// Verify the page was added (should show "Homepage + 1 page" in the title summary)
		await expect(
			page.getByText( 'Homepage + 1 page' ),
			'Should display correct page count in summary'
		).toBeVisible();
	} );

	test( 'Should validate URLs correctly and show error messages', async ( {
		jetpackBoostPage,
		page,
	} ) => {
		await jetpackBoostPage.openCornerstonePagesPanel();

		// Test invalid URL (different site)
		await jetpackBoostPage.enterCornerstonePageUrl( 'https://example.com/test' );
		await expect(
			page.getByText( 'The URL seems to be a different site' ),
			'Should show error for different site URL'
		).toBeVisible();

		// Test homepage URL (should be rejected)
		const homeUrl = await page.evaluate( () => window.Jetpack_Boost.site.url );
		await jetpackBoostPage.enterCornerstonePageUrl( homeUrl );
		await expect(
			page.getByText( 'The homepage does not need to be added' ),
			'Should show error for homepage URL'
		).toBeVisible();
	} );

	test( 'Should enforce free plan limit of 1 custom page', async ( { jetpackBoostPage, page } ) => {
		await jetpackBoostPage.openCornerstonePagesPanel();

		// Try to add 2 pages (should fail on free plan)
		const testUrls = '/test-page-1\n/test-page-2';
		await jetpackBoostPage.enterCornerstonePageUrl( testUrls );

		await expect(
			page.getByText( 'You can add only 1 cornerstone page URL' ),
			'Should show limit error for free plan'
		).toBeVisible();

		// Verify save button is disabled
		await expect(
			page.getByRole( 'button', { name: 'Save' } ).first(),
			'Save button should be disabled with validation error'
		).toBeDisabled();
	} );

	test( 'Should allow adding up to 10 pages on premium plan', async ( {
		jetpackBoostPage,
		page,
		boostUtils,
	} ) => {
		// Mock premium features using the new plugin approach
		await boostUtils.mockPremiumFeatures( [ 'cornerstone-10-pages' ] );
		// reload for the mock to take effect
		await page.reload();

		await jetpackBoostPage.openCornerstonePagesPanel();

		// Verify that premium features are detected
		await expect(
			page.getByRole( 'button', { name: 'Cornerstone Pages Upgraded' } ),
			'Premium features should be detected by the frontend'
		).toBeVisible();

		// Add 10 pages
		const tenPages = Array.from( { length: 10 }, ( _, i ) => `/page-${ i + 1 }` ).join( '\n' );
		await jetpackBoostPage.addCornerstonePage( tenPages );

		// Verify the pages were added
		await expect(
			page.getByText( 'Homepage + 10 pages' ),
			'Should display correct page count in summary for 10 pages'
		).toBeVisible();
	} );

	test( 'Should enforce premium plan limit of 10 custom pages', async ( {
		jetpackBoostPage,
		page,
		boostUtils,
	} ) => {
		// Mock premium features using the new plugin approach
		await boostUtils.mockPremiumFeatures( [ 'cornerstone-10-pages' ] );
		// reload for the mock to take effect
		await page.reload();

		await jetpackBoostPage.openCornerstonePagesPanel();

		// Try to add 11 pages
		const elevenPages = Array.from( { length: 11 }, ( _, i ) => `/page-${ i + 1 }` ).join( '\n' );
		await jetpackBoostPage.enterCornerstonePageUrl( elevenPages );

		await expect(
			page.getByText( 'You can add up to 10 cornerstone page URLs' ),
			'Should show limit error for premium plan'
		).toBeVisible();

		// Verify save button is disabled
		await expect(
			page.getByRole( 'button', { name: 'Save' } ).first(),
			'Save button should be disabled with validation error'
		).toBeDisabled();
	} );

	test( 'Should show upgrade CTA for premium features on free plan', async ( {
		jetpackBoostPage,
		page,
	} ) => {
		await jetpackBoostPage.openCornerstonePagesPanel();

		await expect(
			page.getByText( 'Premium users can add up to 10 cornerstone pages' ),
			'Upgrade CTA should be visible on free plan'
		).toBeVisible();
	} );

	test( 'Should show include default pages functionality', async ( { jetpackBoostPage, page } ) => {
		await jetpackBoostPage.openCornerstonePagesPanel();

		// Check that load default button exists
		const includeDefaultButton = page.getByRole( 'button', { name: 'Include default pages' } );
		await expect(
			includeDefaultButton,
			'Include default pages button should be visible'
		).toBeVisible();

		// Check that tooltip is visible on hover
		await includeDefaultButton.hover();
		await expect(
			page.locator( '[role="tooltip"]' ),
			'Tooltip should be visible on button hover'
		).toBeVisible();

		// Verify button is disabled when no defaults are available (clean test environment)
		await expect(
			includeDefaultButton,
			'Include default pages button should be disabled when no defaults available'
		).toBeDisabled();

		const testUrls = '/sample-page';
		await jetpackBoostPage.enterCornerstonePageUrl( testUrls );

		// Button should remain disabled even with custom content
		await expect(
			includeDefaultButton,
			'Include default pages button should remain disabled with no defaults'
		).toBeDisabled();

		// Should retain existing content when button cannot be clicked
		await expect(
			await jetpackBoostPage.getCornerstonePagesTextarea(),
			'Should retain existing content when no defaults available'
		).toHaveValue( testUrls );
	} );

	test( 'Prerender toggle should be visible when speculation_rules module is available', async ( {
		jetpackBoostPage,
		page,
	} ) => {
		await jetpackBoostPage.openCornerstonePagesPanel();

		await expect(
			page.getByText( 'Prerender Cornerstone Pages' ),
			'Prerender toggle should be visible when speculation_rules is available'
		).toBeVisible();

		// Test toggle functionality
		await jetpackBoostPage.togglePrerenderOption( true );
		await jetpackBoostPage.togglePrerenderOption( false );
	} );

	test( 'Should handle relative URLs correctly', async ( { jetpackBoostPage, page } ) => {
		await jetpackBoostPage.openCornerstonePagesPanel();

		// Test relative URL (should work)
		const relativeUrl = '/about-us';
		await jetpackBoostPage.addCornerstonePage( relativeUrl );

		// Verify it was saved properly
		await expect(
			page.getByText( 'Homepage + 1 page' ),
			'Should accept and save relative URLs'
		).toBeVisible();
	} );

	test( 'Should persist cornerstone pages across page reloads', async ( {
		jetpackBoostPage,
		page,
	} ) => {
		await jetpackBoostPage.openCornerstonePagesPanel();

		const testUrl = '/persistent-page';
		await jetpackBoostPage.addCornerstonePage( testUrl );

		// Reload the page
		await page.reload();
		await jetpackBoostPage.openCornerstonePagesPanel();

		// Check that the page is still there
		const inputValue = await ( await jetpackBoostPage.getCornerstonePagesTextarea() ).inputValue();
		expect( inputValue, 'Cornerstone pages should persist across page reloads' ).toContain(
			testUrl
		);
	} );

	test( 'Should show correct summary in panel title based on number of pages', async ( {
		jetpackBoostPage,
		page,
	} ) => {
		// Should show "Added: Homepage" when no custom pages
		await expect(
			page.getByText( 'Added: Homepage' ),
			'Should show only homepage when no custom pages'
		).toBeVisible();

		await jetpackBoostPage.openCornerstonePagesPanel();
		await jetpackBoostPage.addCornerstonePage( '/test-summary' );

		// Should show "Added: Homepage + 1 page"
		await expect(
			page.getByText( 'Added: Homepage + 1 page' ),
			'Should show correct count with 1 custom page'
		).toBeVisible();
	} );
} );
