import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites.js';
import { test, expect } from '../../lib/fixtures/test.ts';
import playwrightConfig from '../../playwright.config.ts';

test.describe.serial( 'Critical CSS module', () => {
	let previousTheme = null;

	test.beforeAll( async ( { browser, testUtils } ) => {
		const page = await browser.newPage( playwrightConfig.use );
		await boostPrerequisitesBuilder( page )
			.withCleanEnv()
			.withMockConnection( true )
			.withSpeedScoreMocked( true )
			.build();

		await testUtils.executeWpCommand( 'plugin activate e2e-critical-css-force-errors' );
		await page.close();
	} );

	test.afterAll( async ( { testUtils } ) => {
		await testUtils.executeWpCommand( 'plugin deactivate e2e-critical-css-force-errors' );

		if ( previousTheme !== null ) {
			await testUtils.executeWpCommand( `theme activate ${ previousTheme }` );
		}
	} );

	// NOTE: The order of the following tests is important as we are making reuse of the generated Critical CSS
	// which is an onerous task in a test.

	test( 'No Critical CSS meta information should show on the admin when the module is inactive', async ( {
		testUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await testUtils.deactivateBoostModule( 'critical_css' );
		await jetpackBoostPage.visit();
		await expect(
			page.getByTestId( 'critical-css-meta' ),
			'Critical CSS meta information should be visible'
		).toBeHidden();
	} );

	test( 'No Critical CSS should be available on the frontend when the module is inactive', async ( {
		testUtils,
		page,
	} ) => {
		await testUtils.deactivateBoostModule( 'critical_css' );
		await page.goto( '/' );
		expect(
			await page.locator( '#jetpack-boost-critical-css' ).count( {
				timeout: 5 * 1000,
			} ),
			'No Critical CSS should be displayed'
		).toBe( 0 );
	} );

	test( 'Critical CSS should be generated when the module is active', async ( {
		testUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await testUtils.activateBoostModule( 'critical_css' );
		await jetpackBoostPage.visit();

		await expect(
			page.getByTestId( 'critical-css-meta' ),
			'Critical CSS meta information should be visible'
		).toBeVisible( { timeout: 60 * 1000 } );
	} );

	test( 'Critical CSS meta information should show on the admin when the module is re-activated', async ( {
		testUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await testUtils.deactivateBoostModule( 'critical_css' );
		await testUtils.activateBoostModule( 'critical_css' );
		await jetpackBoostPage.visit();
		await expect(
			page.getByTestId( 'critical-css-meta' ),
			'Critical CSS meta information should be visible'
		).toBeVisible( { timeout: 60 * 1000 } );
	} );

	test( 'Critical CSS should be available on the frontend when the module is active', async ( {
		page,
	} ) => {
		await page.goto( '/' );
		const criticalCss = await page.locator( '#jetpack-boost-critical-css' ).innerText();
		expect( criticalCss.length, 'Critical CSS should be displayed' ).toBeGreaterThan( 100 );
	} );

	test( 'Critical CSS Admin message should show when the theme is changed', async ( {
		testUtils,
		page,
		admin,
	} ) => {
		await testUtils.activateBoostModule( 'critical_css' );
		await admin.visitAdminPage( 'themes.php' );
		// Remember the current theme so we can switch back to it during cleanup.
		previousTheme = await page.locator( '.theme.active' ).getAttribute( 'data-slug' );

		await page.locator( "a[href*='=activate']" ).first().click();

		await expect(
			page.getByText( 'Jetpack Boost - Action Required' ),
			'Action Required message should be visible'
		).toBeVisible();

		await page.getByRole( 'link', { name: 'Go to Jetpack Boost' } ).click();

		await expect(
			page.getByTestId( 'critical-css-meta' ),
			'Critical CSS meta information should be visible'
		).toBeVisible( { timeout: 60 * 1000 } );
	} );

	test( 'User can access the Critical advanced recommendations and go back to settings page', async ( {
		testUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await testUtils.activateBoostModule( 'critical_css' );

		await jetpackBoostPage.visit();

		await page.getByRole( 'button', { name: 'Regenerate' } ).click();

		await expect(
			page.getByTestId( 'critical-css-meta' ),
			'Critical CSS meta information should be visible'
		).toBeVisible( { timeout: 60 * 1000 } );

		await page.getByText( 'Advanced Recommendations' ).click();
		await expect(
			page.locator( '.jb-critical-css__advanced' ),
			'Critical CSS advanced recommendations should be visible'
		).toBeVisible();

		await page.getByRole( 'button', { name: 'Go back' } ).click();
		await expect(
			page.getByTestId( 'critical-css-meta' ),
			'Critical CSS meta information should be visible'
		).toBeVisible( { timeout: 60 * 1000 } );
	} );
} );
