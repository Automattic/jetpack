import { expect, test } from '../../lib/fixtures/test';

test.describe( 'LCP Image Optimization module', () => {
	test.beforeAll( async ( { boostUtils } ) => {
		await boostUtils.resetEnvironment();
		await boostUtils.mockConnection();
		await boostUtils.mockSpeedScore();
		await boostUtils.executeWpCommand( 'plugin activate e2e-mock-lcp-optimization-api' );
	} );

	test.afterAll( async ( { boostUtils } ) => {
		await boostUtils.unMockConnection();
		await boostUtils.unMockSpeedScore();
		await boostUtils.executeWpCommand( 'plugin deactivate e2e-mock-lcp-optimization-api' );
	} );

	test( 'LCP optimization UI should be toggled off when module is inactive', async ( {
		boostUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await boostUtils.deactivateBoostModule( [ 'lcp' ] );
		await jetpackBoostPage.visit();

		await expect(
			page.getByTestId( 'module-lcp' ).getByRole( 'checkbox' ),
			'LCP optimization UI should not be visible when module is inactive'
		).not.toBeChecked();
	} );

	test( 'LCP optimization should start analysis when module is activated', async ( {
		boostUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await boostUtils.deactivateBoostModule( [ 'lcp' ] );
		await jetpackBoostPage.visit();

		// Don't await the click, as it will trigger the analysis, we will await the status change instead
		await page.getByTestId( 'module-lcp' ).getByRole( 'checkbox' ).check();

		// Should show pending state initially.
		await expect(
			page.getByText( "Jetpack Boost is optimizing your Cornerstone Page's LCP for you" ),
			'LCP optimization should show pending status during analysis'
		).toBeVisible( { timeout: 20000 } );

		await expect(
			page.getByRole( 'button', { name: 'Optimize' } ),
			'Optimize button should be disabled during pending state'
		).toBeDisabled();

		// Wait for analysis to complete — allow extra time as this is an async background operation
		await expect(
			page.getByText( 'Last optimized' ),
			'LCP optimization should complete analysis and show analyzed state'
		).toBeVisible( { timeout: 30000 } );

		// Click the Optimize button
		await page.getByRole( 'button', { name: 'Optimize' } ).click();

		// Should show pending state after clicking optimize
		await expect(
			page.getByText( "Jetpack Boost is optimizing your Cornerstone Page's LCP for you" ),
			'LCP optimization should show pending status after clicking Optimize button'
		).toBeVisible( { timeout: 20000 } );

		// Analysis completion can take longer than the default timeout
		await expect(
			page.getByText( 'Last optimized' ),
			'LCP optimization should complete re-analysis and show analyzed state'
		).toBeVisible( { timeout: 30000 } );
	} );
} );
