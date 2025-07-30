import { expect, test } from '_jetpack-e2e-commons/fixtures/base-test.ts';
import playwrightConfig from '_jetpack-e2e-commons/playwright.config.mjs';
import { executeWpCommand } from '_jetpack-e2e-commons/utils/cli.ts';
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

		await executeWpCommand( 'plugin activate e2e-mock-lcp-optimization-api' );
	} );

	test.afterAll( async () => {
		await executeWpCommand( 'plugin deactivate e2e-mock-lcp-optimization-api' );

		await page.close();
	} );

	test( 'LCP optimization UI should be toggled off when module is inactive', async ( {
		testUtils,
	} ) => {
		await testUtils.deactivateBoostModule( [ 'lcp' ] );
		await JetpackBoostPage.visit( page );

		await expect(
			page.locator( '[data-testid="module-lcp"] input' ),
			'LCP optimization UI should not be visible when module is inactive'
		).not.toBeChecked();
	} );

	test( 'LCP optimization should start analysis when module is activated', async ( {
		testUtils,
	} ) => {
		await testUtils.deactivateBoostModule( [ 'lcp' ] );
		const jetpackBoostPage = await JetpackBoostPage.visit( page );

		// Don't await the click, as it will trigger the analysis, we will await the status change instead
		jetpackBoostPage.enableLcpOptimizationButton();

		// Should show pending state initially
		expect(
			await jetpackBoostPage.waitForLcpOptimizationStatus( 'pending' ),
			'LCP optimization should show pending status during analysis'
		).toBeTruthy();
		expect(
			await jetpackBoostPage.isLcpOptimizeButtonDisabled(),
			'Optimize button should be disabled during pending state'
		).toBeTruthy();

		// Wait for analysis to complete
		expect(
			await jetpackBoostPage.waitForLcpOptimizationStatus( 'analyzed' ),
			'LCP optimization should complete analysis and show analyzed state'
		).toBeTruthy();

		// Click the Optimize button
		await jetpackBoostPage.clickLcpOptimizeButton();

		// Should show pending state after clicking optimize
		expect(
			await jetpackBoostPage.waitForLcpOptimizationStatus( 'pending' ),
			'LCP optimization should show pending status after clicking Optimize button'
		).toBeTruthy();

		expect(
			await jetpackBoostPage.waitForLcpOptimizationStatus( 'analyzed' ),
			'LCP optimization should complete re-analysis and show analyzed state'
		).toBeTruthy();
	} );
} );
