import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { RecommendationsPage } from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import { Plans, prerequisitesBuilder } from 'jetpack-e2e-commons/env/index.js';
import playwrightConfig from '../../playwright.config.cjs';

test.beforeAll( async ( { browser } ) => {
	const page = await browser.newPage( playwrightConfig.use );
	await prerequisitesBuilder( page )
		.withCleanEnv()
		.withLoggedIn( true )
		.withWpComLoggedIn( true )
		.withConnection( true )
		.withPlan( Plans.Free )
		.build();
	await page.close();
} );

test( 'Recommendations (Jetpack Assistant)', async ( { page } ) => {
	let recommendationsPage;

	await test.step( 'Navigate to the Recommendations module', async () => {
		recommendationsPage = await RecommendationsPage.visit( page );
		const isPageVisible = await recommendationsPage.areSiteTypeQuestionsVisible();
		expect( isPageVisible, 'Site type questions should be visible' ).toBeTruthy();
		expect(
			recommendationsPage.isUrlInSyncWithStepName( 'site-type' ),
			'URL should be in sync with the step name'
		).toBeTruthy();
	} );

	await test.step( 'Check Personal and Other checkboxes', async () => {
		await recommendationsPage.checkPersonalSiteType();
		await recommendationsPage.checkOtherSiteType();
		expect(
			await recommendationsPage.isPersonalSiteTypeChecked(),
			'Personal site type should be checked'
		).toBeTruthy();
		expect(
			await recommendationsPage.isOtherSiteTypeChecked(),
			'Other site type should be checked'
		).toBeTruthy();
		expect(
			await recommendationsPage.isBusinessTypeUnchecked(),
			'Business type should be checked'
		).toBeFalsy();
		expect(
			await recommendationsPage.isStoreTypeUnchecked(),
			'Store type should be checked'
		).toBeFalsy();
	} );

	await test.step( 'Enable Monitoring and continue to Related Post step', async () => {
		await recommendationsPage.saveSiteTypeAndContinue();
		await recommendationsPage.reload();
		await recommendationsPage.waitForNetworkIdle();
		await recommendationsPage.enableMonitoringAndContinue();
		await recommendationsPage.reload();
		await recommendationsPage.waitForNetworkIdle();
		const isRelatedPostsStep = await recommendationsPage.isEnableRelatedPostsButtonVisible();
		expect( isRelatedPostsStep, 'Related posts step should be visible' ).toBeTruthy();
		expect(
			recommendationsPage.isUrlInSyncWithStepName( 'related-posts' ),
			'URL should be in sync with the step name'
		).toBeTruthy();
	} );

	await test.step( 'Enable Related Posts and continue to Creative Mail step', async () => {
		await recommendationsPage.enableRelatedPostsAndContinue();
		await recommendationsPage.reload();
		await recommendationsPage.waitForNetworkIdle();
		const isCreativeMailStep = await recommendationsPage.isInstallCreativeMailButtonVisible();
		expect( isCreativeMailStep, 'Creative Mail step should ne visible' ).toBeTruthy();
		expect(
			recommendationsPage.isUrlInSyncWithStepName( 'creative-mail' ),
			'URL should be in sync with the step name'
		).toBeTruthy();
	} );

	await test.step( 'Skip Creative Mail and continue to Site Accelerator', async () => {
		await recommendationsPage.skipCreativeMailAndContinue();
		await recommendationsPage.reload();
		await recommendationsPage.waitForNetworkIdle();
		const isSiteAcceleratorStep = await recommendationsPage.isEnableSiteAcceleratorButtonVisible();
		expect( isSiteAcceleratorStep, 'Site Accelerator step should be visible' ).toBeTruthy();
		expect(
			recommendationsPage.isUrlInSyncWithStepName( 'site-accelerator' ),
			'URL should be in sync with the step name'
		).toBeTruthy();
	} );

	await test.step( 'Skip Site Accelerator and continue to Summary', async () => {
		await recommendationsPage.skipSiteAcceleratorAndContinue();
		await recommendationsPage.reload();
		await recommendationsPage.waitForNetworkIdle();
		const isSummaryContent = await recommendationsPage.isSummaryContentVisible();
		const isSummarySidebar = await recommendationsPage.isSummarySidebarVisible();
		expect(
			isSummaryContent && isSummarySidebar,
			'Summary content and Summary sidebar should be visible'
		).toBeTruthy();
		expect(
			recommendationsPage.isUrlInSyncWithStepName( 'summary' ),
			'URL should be in sync with the step name'
		).toBeTruthy();
	} );

	await test.step( 'Verify Monitoring and Related Posts are enabled', async () => {
		const isMonitoringFeatureEnabled = await recommendationsPage.isMonitoringFeatureEnabled();
		const isRelatedPostsFeatureEnabled = await recommendationsPage.isRelatedPostsFeatureEnabled();
		expect(
			isMonitoringFeatureEnabled && isRelatedPostsFeatureEnabled,
			'Monitoring feature and Related Posts should be enabled'
		).toBeTruthy();
	} );

	await test.step( 'Verify Creative Mail and Site Accelerator are disabled', async () => {
		const isCreativeMailFeatureEnabled = await recommendationsPage.isCreativeMailFeatureEnabled();
		const isSiteAcceleratorFeatureEnabled = await recommendationsPage.isSiteAcceleratorFeatureEnabled();
		expect(
			isCreativeMailFeatureEnabled && isSiteAcceleratorFeatureEnabled,
			'Creative Mail and Site Accelerator should be enabled'
		).toBeTruthy();
	} );
} );
