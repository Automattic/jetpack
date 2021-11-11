import { test, expect } from '@playwright/test';
import { RecommendationsPage } from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/index.js';

/**
 *
 * @group post-connection
 * @group recommendations
 */
test.beforeAll( async ( { browser } ) => {
	const page = await browser.newPage();
	await prerequisitesBuilder( page )
		.withLoggedIn( true )
		.withWpComLoggedIn( true )
		.withConnection( true )
		.build();
} );

test( 'Recommendations (Jetpack Assistant)', async ( { page } ) => {
	let recommendationsPage;

	await test.step( 'Navigate to the Recommendations module', async () => {
		recommendationsPage = await RecommendationsPage.visit( page );
		const isPageVisible = await recommendationsPage.areSiteTypeQuestionsVisible();
		expect( isPageVisible ).toBeTruthy();
		expect( recommendationsPage.isUrlInSyncWithStepName( 'site-type' ) ).toBeTruthy();
	} );

	await test.step( 'Check Personal and Other checkboxes', async () => {
		await recommendationsPage.checkPersonalSiteType();
		await recommendationsPage.checkOtherSiteType();
		expect( await recommendationsPage.isPersonalSiteTypeChecked() ).toBeTruthy();
		expect( await recommendationsPage.isOtherSiteTypeChecked() ).toBeTruthy();
		expect( await recommendationsPage.isBusinessTypeUnchecked() ).toBeFalsy();
		expect( await recommendationsPage.isStoreTypeUnchecked() ).toBeFalsy();
	} );

	await test.step( 'Save answers and continue to the Monitor step', async () => {
		await recommendationsPage.saveSiteTypeAndContinue();
		await recommendationsPage.reload();
		await recommendationsPage.waitForNetworkIdle();
		const isMonitorStep = await recommendationsPage.isEnableMonitoringButtonVisible();
		expect( isMonitorStep ).toBeTruthy();
		expect( recommendationsPage.isUrlInSyncWithStepName( 'monitor' ) ).toBeTruthy();
	} );

	await test.step( 'Enable Monitoring and continue to Related Post step', async () => {
		await recommendationsPage.enableMonitoringAndContinue();
		await recommendationsPage.reload();
		await recommendationsPage.waitForNetworkIdle();
		const isRelatedPostsStep = await recommendationsPage.isEnableRelatedPostsButtonVisible();
		expect( isRelatedPostsStep ).toBeTruthy();
		expect( recommendationsPage.isUrlInSyncWithStepName( 'related-posts' ) ).toBeTruthy();
	} );

	await test.step( 'Enable Related Posts and continue to Creative Mail step', async () => {
		await recommendationsPage.enableRelatedPostsAndContinue();
		await recommendationsPage.reload();
		await recommendationsPage.waitForNetworkIdle();
		const isCreativeMailStep = await recommendationsPage.isInstallCreativeMailButtonVisible();
		expect( isCreativeMailStep ).toBeTruthy();
		expect( recommendationsPage.isUrlInSyncWithStepName( 'creative-mail' ) ).toBeTruthy();
	} );

	await test.step( 'Skip Creative Mail and continue to Site Accelerator', async () => {
		await recommendationsPage.skipCreativeMailAndContinue();
		await recommendationsPage.reload();
		await recommendationsPage.waitForNetworkIdle();
		const isSiteAcceleratorStep = await recommendationsPage.isEnableSiteAcceleratorButtonVisible();
		expect( isSiteAcceleratorStep ).toBeTruthy();
		expect( recommendationsPage.isUrlInSyncWithStepName( 'site-accelerator' ) ).toBeTruthy();
	} );

	await test.step( 'Skip Site Accelerator and continue to Summary', async () => {
		await recommendationsPage.skipSiteAcceleratorAndContinue();
		await recommendationsPage.reload();
		await recommendationsPage.waitForNetworkIdle();
		const isSummaryContent = await recommendationsPage.isSummaryContentVisible();
		const isSummarySidebar = await recommendationsPage.isSummarySidebarVisible();
		expect( isSummaryContent && isSummarySidebar ).toBeTruthy();
		expect( recommendationsPage.isUrlInSyncWithStepName( 'summary' ) ).toBeTruthy();
	} );

	await test.step( 'Verify Monitoring and Related Posts are enabled', async () => {
		const isMonitoringFeatureEnabled = await recommendationsPage.isMonitoringFeatureEnabled();
		const isRelatedPostsFeatureEnabled = await recommendationsPage.isRelatedPostsFeatureEnabled();
		expect( isMonitoringFeatureEnabled && isRelatedPostsFeatureEnabled ).toBeTruthy();
	} );

	await test.step( 'Verify Creative Mail and Site Accelerator are disabled', async () => {
		const isCreativeMailFeatureEnabled = await recommendationsPage.isCreativeMailFeatureEnabled();
		const isSiteAcceleratorFeatureEnabled = await recommendationsPage.isSiteAcceleratorFeatureEnabled();
		expect( isCreativeMailFeatureEnabled && isSiteAcceleratorFeatureEnabled ).toBeTruthy();
	} );
} );
