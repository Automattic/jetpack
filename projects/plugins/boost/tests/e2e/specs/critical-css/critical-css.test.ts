import { test, expect } from '../../lib/fixtures/test';

test.describe.serial( 'Critical CSS module', () => {
	let previousTheme: string | null = null;

	test.beforeAll( async ( { boostUtils } ) => {
		await boostUtils.resetEnvironment();
		await boostUtils.mockConnection();
		await boostUtils.mockSpeedScore();

		await boostUtils.executeWpCommand( 'plugin activate e2e-critical-css-force-errors' );
	} );

	test.afterAll( async ( { boostUtils } ) => {
		await boostUtils.unMockConnection();
		await boostUtils.unMockSpeedScore();
		await boostUtils.executeWpCommand( 'plugin deactivate e2e-critical-css-force-errors' );

		if ( previousTheme !== null ) {
			await boostUtils.executeWpCommand( `theme activate ${ previousTheme }` );
		}
	} );

	// NOTE: The order of the following tests is important as we are making reuse of the generated Critical CSS
	// which is an onerous task in a test.

	test( 'No Critical CSS meta information should show on the admin when the module is inactive', async ( {
		boostUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await boostUtils.deactivateBoostModule( 'critical_css' );
		await jetpackBoostPage.visit();
		await expect(
			page.getByTestId( 'critical-css-meta' ),
			'Critical CSS meta information should be visible'
		).toBeHidden();
	} );

	test( 'No Critical CSS should be available on the frontend when the module is inactive', async ( {
		boostUtils,
		page,
	} ) => {
		await boostUtils.deactivateBoostModule( 'critical_css' );
		await page.goto( '/' );
		await expect(
			page.locator( '#jetpack-boost-critical-css' ),
			'No Critical CSS should be displayed'
		).toHaveCount( 0 );
	} );

	test( 'Critical CSS should be generated when the module is active', async ( {
		boostUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await boostUtils.activateBoostModule( 'critical_css' );
		await boostUtils.executeWpCommand(
			'plugin activate e2e-external-css-enqueue/e2e-external-css-enqueue.php'
		);
		await jetpackBoostPage.visit();

		await expect(
			page.getByTestId( 'critical-css-meta' ),
			'Critical CSS meta information should be visible'
		).toBeVisible( { timeout: 60 * 1000 } );
	} );

	test( 'Critical CSS meta information should show on the admin when the module is re-activated', async ( {
		boostUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await boostUtils.deactivateBoostModule( 'critical_css' );
		await boostUtils.activateBoostModule( 'critical_css' );
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
		boostUtils,
		page,
		admin,
	} ) => {
		await boostUtils.activateBoostModule( 'critical_css' );
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
		boostUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await boostUtils.activateBoostModule( 'critical_css' );

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
