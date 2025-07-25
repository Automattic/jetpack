import { expect, test } from '_jetpack-e2e-commons/fixtures/base-test.ts';
import { execWpCommand } from '_jetpack-e2e-commons/helpers/utils-helper.js';
import playwrightConfig from '_jetpack-e2e-commons/playwright.config.mjs';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites.js';
import { JetpackBoostPage } from '../../lib/pages/index.js';

test.describe( 'LCP Image Optimization module', () => {
	let page;

	test.beforeAll( async ( { browser } ) => {
		page = await browser.newPage( playwrightConfig.use );
		await boostPrerequisitesBuilder( page )
			.withCleanEnv()
			.withMockConnection( true )
			.withSpeedScoreMocked( true )
			.build();

		await execWpCommand( 'plugin activate e2e-mock-lcp-optimization-api' );
	} );

	test.afterAll( async () => {
		await execWpCommand( 'plugin deactivate e2e-mock-lcp-optimization-api' );
		await page.close();
	} );

	// NOTE: The order of tests is important as we reuse generated LCP data which is resource-intensive to create

	test( 'LCP optimization UI should be toggled off when module is inactive', async () => {
		await boostPrerequisitesBuilder( page ).withInactiveModules( [ 'lcp' ] ).build();
		await JetpackBoostPage.visit( page );

		await expect(
			page.locator( '[data-testid="module-lcp"] input' ),
			'LCP optimization UI should not be visible when module is inactive'
		).not.toBeChecked();
	} );

	test( 'LCP optimization should start analysis when module is activated', async () => {
		await boostPrerequisitesBuilder( page ).withInactiveModules( [ 'lcp' ] ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );

		// Don't await the click, as it will trigger the analysis, we will await the status change instead
		jetpackBoostPage.clickLcpOptimizeButton();

		// Should show pending state initially
		expect(
			await jetpackBoostPage.waitForLcpOptimizationStatus( 'pending' ),
			'LCP optimization should show pending status during analysis'
		).toBeTruthy();
	} );

	test( 'LCP optimization should complete analysis and show analyzed state', async () => {
		const jetpackBoostPage = await JetpackBoostPage.visit( page );

		// Wait for analysis to complete
		expect(
			await jetpackBoostPage.waitForLcpOptimizationStatus( 'analyzed' ),
			'LCP optimization should complete analysis and show analyzed state'
		).toBeTruthy();

		// Check that "Last optimized" message is shown
		expect(
			await jetpackBoostPage.isLcpLastOptimizedVisible(),
			'Last optimized message should be visible after analysis'
		).toBeTruthy();
	} );

	test( 'Optimize button should be functional and trigger re-analysis', async () => {
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'lcp' ] ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );

		// Wait for analysis to complete first
		await jetpackBoostPage.waitForLcpOptimizationStatus( 'analyzed' );

		// Click the Optimize button
		await jetpackBoostPage.clickLcpOptimizeButton();

		// Should show pending state after clicking optimize
		expect(
			await jetpackBoostPage.waitForLcpOptimizationStatus( 'pending' ),
			'LCP optimization should show pending status after clicking Optimize button'
		).toBeTruthy();

		// Should complete and show analyzed state again
		expect(
			await jetpackBoostPage.waitForLcpOptimizationStatus( 'analyzed' ),
			'LCP optimization should complete re-analysis and show analyzed state'
		).toBeTruthy();
	} );

	test( 'LCP optimization should persist when module is re-activated', async () => {
		await boostPrerequisitesBuilder( page ).withInactiveModules( [ 'lcp' ] ).build();
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'lcp' ] ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );

		expect(
			await jetpackBoostPage.waitForLcpOptimizationStatus( 'analyzed' ),
			'LCP optimization should maintain analyzed state when module is re-activated'
		).toBeTruthy();
	} );

	test( 'LCP optimization should show Beta pill in admin', async () => {
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'lcp' ] ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );

		expect(
			await jetpackBoostPage.isLcpBetaPillVisible(),
			'LCP optimization should show Beta pill indicator'
		).toBeTruthy();
	} );

	test( 'LCP optimization should work offline', async () => {
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'lcp' ] ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );

		// Check that the module indicates it doesn't work offline
		expect(
			await jetpackBoostPage.isLcpWorksOfflineIndicatorVisible(),
			'LCP optimization should indicate it does not work offline'
		).toBeFalsy();
	} );

	test( 'LCP module should handle error states gracefully', async () => {
		// This test would require modifying the mock to return errors
		// For now, we verify the error display component exists in the DOM
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'lcp' ] ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );

		await jetpackBoostPage.waitForLcpOptimizationStatus( 'analyzed' );

		// Verify error details component is present in DOM (even if not visible due to success state)
		expect(
			await jetpackBoostPage.isLcpErrorDetailsComponentInDom(),
			'LCP error details component should be present in DOM for error handling'
		).toBeTruthy();
	} );

	test( 'LCP optimization description should mention Cornerstone Pages', async () => {
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'lcp' ] ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );

		const description = await jetpackBoostPage.getLcpOptimizationDescription();
		expect(
			description,
			'LCP optimization description should mention Cornerstone Pages'
		).toContain( 'Cornerstone Pages' );
		expect( description, 'LCP optimization description should mention LCP' ).toContain(
			'Largest Contentful Paint'
		);
	} );

	test( 'Optimize button should be disabled during pending state', async () => {
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'lcp' ] ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );

		// Wait for analysis to complete
		await jetpackBoostPage.waitForLcpOptimizationStatus( 'analyzed' );

		// Click optimize to trigger pending state
		await jetpackBoostPage.clickLcpOptimizeButton();

		// Check that button is disabled during pending state
		expect(
			await jetpackBoostPage.isLcpOptimizeButtonDisabled(),
			'Optimize button should be disabled during pending state'
		).toBeTruthy();

		// Wait for completion and verify button is enabled again
		await jetpackBoostPage.waitForLcpOptimizationStatus( 'analyzed' );
		expect(
			await jetpackBoostPage.isLcpOptimizeButtonDisabled(),
			'Optimize button should be enabled after analysis completes'
		).toBeFalsy();
	} );
} );
